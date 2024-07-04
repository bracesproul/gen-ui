from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
import requests

load_dotenv()  # Load environment variables from .env

app = Flask(__name__)

# Load API key from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')


@app.route('/api/invoke-model', methods=['POST'])
def invoke_model():
    data = request.json
    input_text = data.get('input')
    chat_history = data.get('chat_history', [])
    
    # Example payload for OpenAI's API
    payload = {
        "model": "gpt-4o",
        "messages": chat_history + [{"role": "user", "content": input_text}],
        "temperature": 0,
        "stream": False
    }
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Make the API call to OpenAI
    response = requests.post(
        'https://api.openai.com/v1/chat/completions',
        json=payload,
        headers=headers
    )
    
    if response.status_code != 200:
        return jsonify({"error": response.json()}), response.status_code
    
    print(response.json())

    return jsonify(response.json())


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5500)
