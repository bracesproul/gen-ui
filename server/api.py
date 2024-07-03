from flask import Flask, request, jsonify, render_template, send_file

app = Flask(__name__)

import requests
@app.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.get_json(force=True)
    message = data.get('message')
    
    # we get the message from the user
    # then we will call the chatbot API and return the response to the variable res
    # we will create a function that will call the chatbot API
    res = ''

    return jsonify({'message': res}), 200


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5500)
