process.env.NODE_ENV = "test";
process.env.WIDGET_RATE_LIMIT_PER_MIN = "5";
process.env.WIDGET_SESSION_SECRET = process.env.WIDGET_SESSION_SECRET || "distinct_test_widget_session_secret_987654321";

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import app from "../app.js";
import User, { generateWidgetApiKey } from "../models/User.js";
import { signWidgetSession } from "../utils/widgetSession.js";
import ChatHistory from "../models/ChatHistory.js";

describe("Widget Security Pipeline Integration Tests", () => {
  let serverInstance;
  let baseUrl;

  const validCompanyId = new mongoose.Types.ObjectId().toString();
  const validApiKey = generateWidgetApiKey();
  const allowedDomain = "example.com";

  const emptyDomainCompanyId = new mongoose.Types.ObjectId().toString();
  const emptyDomainApiKey = generateWidgetApiKey();

  let originalFindById;
  let originalFindOne;
  let originalChatHistoryFind;
  let originalChatHistoryCreate;

  before(async () => {
    originalFindById = User.findById;
    originalFindOne = User.findOne;
    originalChatHistoryFind = ChatHistory.find;
    originalChatHistoryCreate = ChatHistory.create;

    // Apply Mongoose stubs for company lookup
    ChatHistory.find = () => ({
      sort: () => ({
        limit: () => ({
          lean: () => Promise.resolve([]),
        }),
      }),
    });
    ChatHistory.create = () => Promise.resolve({});

    User.findById = (id) => {
      const idStr = id?.toString();
      if (idStr === validCompanyId) {
        return Promise.resolve({
          _id: validCompanyId,
          widgetApiKey: validApiKey,
          allowedDomains: ["example.com", "app.example.com"],
          save: function () {
            return Promise.resolve(this);
          },
        });
      }
      if (idStr === emptyDomainCompanyId) {
        return Promise.resolve({
          _id: emptyDomainCompanyId,
          widgetApiKey: emptyDomainApiKey,
          allowedDomains: [],
          save: function () {
            return Promise.resolve(this);
          },
        });
      }
      return Promise.resolve(null);
    };

    User.findOne = (query) => {
      if (query?.widgetApiKey === validApiKey) {
        return Promise.resolve({
          _id: validCompanyId,
          widgetApiKey: validApiKey,
          allowedDomains: ["example.com", "app.example.com"],
          save: function () {
            return Promise.resolve(this);
          },
        });
      }
      if (query?.widgetApiKey === emptyDomainApiKey) {
        return Promise.resolve({
          _id: emptyDomainCompanyId,
          widgetApiKey: emptyDomainApiKey,
          allowedDomains: [],
          save: function () {
            return Promise.resolve(this);
          },
        });
      }
      return Promise.resolve(null);
    };

    serverInstance = http.createServer(app);
    await new Promise((resolve, reject) => {
      serverInstance.listen(0, "127.0.0.1", (err) => {
        if (err) return reject(err);
        const port = serverInstance.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    User.findById = originalFindById;
    User.findOne = originalFindOne;
    ChatHistory.find = originalChatHistoryFind;
    ChatHistory.create = originalChatHistoryCreate;

    if (serverInstance) {
      await new Promise((res) => serverInstance.close(res));
    }
  });

  it("1. GET /widget/:companyId from allowed referer -> 200 + session token present", async () => {
    const res = await fetch(`${baseUrl}/api/chat/widget/${validCompanyId}`, {
      method: "GET",
      headers: { Referer: "https://www.example.com/pricing" },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.sessionToken);
    assert.equal(body.widgetApiKey, validApiKey);
  });

  it("2. GET /widget/:companyId from disallowed/missing referer -> 403", async () => {
    const resUnauthorized = await fetch(`${baseUrl}/api/chat/widget/${validCompanyId}`, {
      method: "GET",
      headers: { Referer: "https://unauthorized-domain.com" },
    });
    assert.equal(resUnauthorized.status, 403);
    const bodyUnauthorized = await resUnauthorized.json();
    assert.equal(bodyUnauthorized.error, "Domain not authorized");

    const resMissing = await fetch(`${baseUrl}/api/chat/widget/${validCompanyId}`, { method: "GET" });
    assert.equal(resMissing.status, 403);
    const bodyMissing = await resMissing.json();
    assert.equal(bodyMissing.error, "Domain not authorized");
  });

  it("3. GET /widget/:companyId with empty allowedDomains -> 403 (blocked by default)", async () => {
    const res = await fetch(`${baseUrl}/api/chat/widget/${emptyDomainCompanyId}`, {
      method: "GET",
      headers: { Referer: "https://example.com" },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, "Domain not authorized");
  });

  it("4. POST /chat/widget/:companyId missing key header -> 401", async () => {
    const validToken = signWidgetSession(validCompanyId, allowedDomain);
    const res = await fetch(`${baseUrl}/api/chat/widget/${validCompanyId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Widget-Session": validToken,
      },
      body: JSON.stringify({ question: "Hello" }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, "Invalid widget key");
  });

  it("5. POST /chat/widget/:companyId invalid key -> 401", async () => {
    const validToken = signWidgetSession(validCompanyId, allowedDomain);
    const res = await fetch(`${baseUrl}/api/chat/widget/${validCompanyId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Widget-Key": "ctx_live_invalidkey1234567890",
        "X-Widget-Session": validToken,
      },
      body: JSON.stringify({ question: "Hello" }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, "Invalid widget key");
  });

  it("6. POST /chat/widget/:companyId missing/invalid/expired token -> 401", async () => {
    const resMissingToken = await fetch(`${baseUrl}/api/chat/widget/${validCompanyId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Widget-Key": validApiKey,
      },
      body: JSON.stringify({ question: "Hello" }),
    });
    assert.equal(resMissingToken.status, 401);
    const bodyMissing = await resMissingToken.json();
    assert.equal(bodyMissing.error, "Invalid or expired widget session");

    const resTampered = await fetch(`${baseUrl}/api/chat/widget/${validCompanyId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Widget-Key": validApiKey,
        "X-Widget-Session": "invalid.jwt.token",
      },
      body: JSON.stringify({ question: "Hello" }),
    });
    assert.equal(resTampered.status, 401);
    const bodyTampered = await resTampered.json();
    assert.equal(bodyTampered.error, "Invalid or expired widget session");
  });

  it("7. POST /chat/widget/:companyId valid token but mismatched companyId in URL -> 403", async () => {
    const validToken = signWidgetSession(validCompanyId, allowedDomain);
    const otherCompanyId = new mongoose.Types.ObjectId().toString();

    const res = await fetch(`${baseUrl}/api/chat/widget/${otherCompanyId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Widget-Key": validApiKey,
        "X-Widget-Session": validToken,
      },
      body: JSON.stringify({ question: "Hello" }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, "Forbidden: Company ID mismatch");
  });

  it("8. OPTIONS preflight resolves company via URL param and returns CORS headers", async () => {
    const res = await fetch(`${baseUrl}/api/chat/widget/${validCompanyId}`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.com",
        "Access-Control-Request-Headers": "X-Widget-Key, X-Widget-Session, Content-Type",
      },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), "https://example.com");
    assert.ok(res.headers.get("access-control-allow-headers")?.toLowerCase().includes("x-widget-key"));
  });

  it("9. Rate limiter trips after request threshold -> 429", async () => {
    const validToken = signWidgetSession(validCompanyId, allowedDomain);
    let hitRateLimit = false;

    for (let i = 0; i < 25; i++) {
      const res = await fetch(`${baseUrl}/api/chat/widget/${validCompanyId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Widget-Key": validApiKey,
          "X-Widget-Session": validToken,
        },
        body: JSON.stringify({ question: "Rate limit test" }),
      });

      if (res.status === 429) {
        hitRateLimit = true;
        const body = await res.json();
        assert.equal(body.error, "Too many requests. Please try again later.");
        break;
      }
    }

    assert.equal(hitRateLimit, true, "Rate limit should have tripped with 429");
  });

  it("10. POST /api/auth/rotate-widget-key authenticated user -> 200 + new key returned", async () => {
    const authJwt = jwt.sign({ id: validCompanyId }, process.env.JWT_SECRET || "test_jwt_secret_key_1234567890");

    const res = await fetch(`${baseUrl}/api/auth/rotate-widget-key`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authJwt}`,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.widgetApiKey);
    assert.ok(body.widgetApiKey.startsWith("ctx_live_"));
  });

  it("11. POST /api/admin/companies/:companyId/rotate-widget-key -> 200 + new key returned", async () => {
    const authJwt = jwt.sign({ id: validCompanyId }, process.env.JWT_SECRET || "test_jwt_secret_key_1234567890");

    const res = await fetch(`${baseUrl}/api/admin/companies/${validCompanyId}/rotate-widget-key`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authJwt}`,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.widgetApiKey);
    assert.ok(body.widgetApiKey.startsWith("ctx_live_"));
  });
});

