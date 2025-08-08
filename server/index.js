import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 4000;
const GPT_OSS_URL =
	process.env.GPT_OSS_URL || "http://localhost:8000/v1/chat/completions";
const API_KEY = process.env.GPT_OSS_API_KEY;

// Middleware
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json());

// Validate env in production
if (process.env.NODE_ENV === "production" && !GPT_OSS_URL) {
	console.error("❌ Missing GPT_OSS_URL in environment variables");
	process.exit(1);
}

// Proxy endpoint
app.post("/api/chat", async (req, res) => {
	try {
		const response = await axios.post(GPT_OSS_URL, req.body, {
			headers: {
				"Content-Type": "application/json",
				...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
			},
			timeout: 15000, // 15s timeout
		});

		res.status(response.status).json(response.data);
	} catch (error) {
		console.error("❌ /api/chat error:", error.message);
		console.error("Request body:", JSON.stringify(req.body, null, 2));
		if (error.response) {
			console.error("Upstream response:", error.response.data);
		}

		res.status(error.response?.status || 500).json({
			error: error.message,
			upstream: error.response?.data || null,
		});
	}
});

app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});
