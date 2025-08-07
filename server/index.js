import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 4000;
const GPT_OSS_URL =
	process.env.GPT_OSS_URL || "http://localhost:8000/v1/chat/completions";

app.use(cors());
app.use(express.json());

// Proxy endpoint for chat completions
app.post("/api/chat", async (req, res) => {
	try {
		const response = await axios.post(GPT_OSS_URL, req.body, {
			headers: {
				"Content-Type": "application/json",
				...(process.env.GPT_OSS_API_KEY
					? { Authorization: `Bearer ${process.env.GPT_OSS_API_KEY}` }
					: {}),
			},
		});
		res.json(response.data);
	} catch (error) {
		res
			.status(error.response?.status || 500)
			.json({ error: error.message, details: error.response?.data });
	}
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
