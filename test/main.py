from ollama import Client
client = Client(
    host="http://localhost:11435",
)

def get_weather(city: str):
    return f"The weather in {city} is sunny."

response = client.chat(
    model="qwen3",
    messages=[
        {"role": "user", "content": "What is the weather in Tokyo?"},
    ],
    tools=[get_weather]
)
print(response)
# for chunk in response:
#     print(chunk)