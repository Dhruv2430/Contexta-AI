import User, { generateWidgetApiKey } from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// ---------------------------------------------------------------------------
// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
// ---------------------------------------------------------------------------
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // --- Validate required fields ---
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    // --- Check if user already exists ---
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // --- Create user (password hashed automatically via pre-save hook) ---
    const user = await User.create({ name, email, password });

    // --- Generate token and respond ---
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        widgetApiKey: user.widgetApiKey,
        allowedDomains: user.allowedDomains,
      },
    });
  } catch (error) {
    // Handle Mongoose validation errors cleanly
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle duplicate key error (race condition on unique email)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// ---------------------------------------------------------------------------
// @desc    Login user & return token
// @route   POST /api/auth/login
// @access  Public
// ---------------------------------------------------------------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Validate required fields ---
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // --- Find user and explicitly include password (since select: false) ---
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // --- Compare passwords ---
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // --- Generate token and respond ---
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        widgetApiKey: user.widgetApiKey,
        allowedDomains: user.allowedDomains,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private (requires valid JWT)
// ---------------------------------------------------------------------------
export const getMe = async (req, res) => {
  try {
    // req.user is set by the auth middleware after token verification
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        widgetApiKey: user.widgetApiKey,
        allowedDomains: user.allowedDomains,
        widgetSettings: user.widgetSettings || {
          botName: "AI Assistant",
          welcomeMessage: "Hi there! How can I help you today?",
          themeColor: "#15803d",
          position: "right",
          strictMode: false,
        },
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// ---------------------------------------------------------------------------
// @desc    Rotate widget API key for authenticated company
// @route   POST /api/auth/rotate-widget-key
//          POST /api/auth/companies/:companyId/rotate-widget-key
// @access  Private (requires valid JWT)
// ---------------------------------------------------------------------------
export const rotateWidgetKey = async (req, res) => {
  try {
    const targetId = req.params.companyId || req.user._id;

    if (req.params.companyId && req.user._id.toString() !== req.params.companyId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only rotate your own company widget key",
      });
    }

    const user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User/Company not found" });
    }

    const newKey = generateWidgetApiKey();
    user.widgetApiKey = newKey;
    await user.save();

    console.log(
      `[Security Audit Log] Widget API key rotated for user/company ID: ${user._id} by user ID: ${req.user._id}`
    );

    return res.status(200).json({
      success: true,
      message: "Widget API key rotated successfully",
      widgetApiKey: newKey,
    });
  } catch (error) {
    console.error("Rotate widget key error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during key rotation",
    });
  }
};

// ---------------------------------------------------------------------------
// @desc    Update allowed domains for authenticated company
// @route   PUT /api/auth/allowed-domains
// @access  Private (requires valid JWT)
// ---------------------------------------------------------------------------
export const updateAllowedDomains = async (req, res) => {
  try {
    const { allowedDomains } = req.body;

    if (!Array.isArray(allowedDomains)) {
      return res.status(400).json({
        success: false,
        message: "allowedDomains must be an array of domain strings.",
      });
    }

    // Normalize domains (lowercase, strip protocol, port, path, leading www)
    const cleanedDomains = allowedDomains
      .map((d) => {
        if (typeof d !== "string") return "";
        let clean = d.trim().toLowerCase();
        clean = clean.replace(/^(https?:\/\/)?(www\.)?/, "");
        clean = clean.split("/")[0].split(":")[0];
        return clean;
      })
      .filter((d) => d.length > 0);

    const uniqueDomains = [...new Set(cleanedDomains)];

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.allowedDomains = uniqueDomains;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Allowed domains updated successfully.",
      allowedDomains: user.allowedDomains,
    });
  } catch (error) {
    console.error("Update allowed domains error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update allowed domains.",
    });
  }
};

// ---------------------------------------------------------------------------
// @desc    Update widget branding & customization settings
// @route   PUT /api/auth/widget-settings
// @access  Private (requires valid JWT)
// ---------------------------------------------------------------------------
export const updateWidgetSettings = async (req, res) => {
  try {
    const { botName, welcomeMessage, themeColor, position, strictMode } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.widgetSettings) {
      user.widgetSettings = {};
    }

    if (typeof botName === "string") user.widgetSettings.botName = botName.trim();
    if (typeof welcomeMessage === "string") user.widgetSettings.welcomeMessage = welcomeMessage.trim();
    if (typeof themeColor === "string") user.widgetSettings.themeColor = themeColor.trim();
    if (typeof position === "string") user.widgetSettings.position = position.trim();
    if (typeof strictMode === "boolean") user.widgetSettings.strictMode = strictMode;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Widget settings updated successfully.",
      widgetSettings: user.widgetSettings,
    });
  } catch (error) {
    console.error("Update widget settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update widget settings.",
    });
  }
};
