
import { fetch } from 'undici';

async function test() {
  const port = 5002;
  const baseUrl = `http://127.0.0.1:${port}`;
  
  console.log("Testing GET /api/messages/conversations?userId=1");
  try {
    const res = await fetch(`${baseUrl}/api/messages/conversations?userId=1`);
    console.log("GET Status:", res.status);
    const text = await res.text();
    console.log("GET Body:", text);
  } catch (e) {
    console.error("GET Failed:", e);
  }

  console.log("\nTesting POST /api/messages");
  try {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: 1,
        receiverId: 2,
        content: "Test Node Script"
      })
    });
    console.log("POST Status:", res.status);
    const text = await res.text();
    console.log("POST Body:", text);
  } catch (e) {
    console.error("POST Failed:", e);
  }
}

test();
