from fastapi import FastAPI  # type: ignore
from fastapi.responses import StreamingResponse  # type: ignore
from openai import OpenAI  # type: ignore
import os

app = FastAPI()

@app.get("/api", response_class=StreamingResponse)
def idea():
    # client = OpenAI()
    # client = OpenAI(
    #     base_url="http://localhost:11434/v1",
    #     api_key="ollama"  # Required by SDK, but ignored by Ollama
    # )
    client = OpenAI(
            api_key=os.environ.get("ANTHROPIC_API_KEY"),  # Your Claude API key
            base_url="https://api.anthropic.com/v1/",  # the Claude API endpoint
        )
    prompt = [{"role": "user", "content": "Come up with a new business idea for AI Agents, formatted with headings, sub-headings and bullet points"}]
    stream = client.chat.completions.create(model="claude-haiku-4-5", messages=prompt, stream=True)

    def event_stream():
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text:
                    lines = text.split("\n")
                    for line in lines:
                        yield f"data: {line}\n"
                    yield "\n"
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")