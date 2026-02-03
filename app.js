// Simple AI Companion - Basic Version
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Simple responses
const responses = {
    'hello': 'Hello! How can I help you today?',
    'hi': 'Hi there! What would you like to talk about?',
    'how are you': 'I\'m doing well, thank you for asking! How are you?',
    'bye': 'Goodbye! Have a great day!',
    'help': 'I\'m here to chat with you! Try saying hello or asking how I am.',
    'default': 'I\'m still learning! Try asking me something else.'
};

function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getResponse(input) {
    const lowerInput = input.toLowerCase().trim();
    
    for (let key in responses) {
        if (lowerInput.includes(key)) {
            return responses[key];
        }
    }
    return responses['default'];
}

function handleSend() {
    const message = userInput.value.trim();
    if (message) {
        addMessage(message, true);
        userInput.value = '';
        
        setTimeout(() => {
            const response = getResponse(message);
            addMessage(response, false);
        }, 500);
    }
}

sendButton.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSend();
    }
});
