import User from "../models/User.js";
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
