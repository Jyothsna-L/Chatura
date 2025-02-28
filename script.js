// Ensure DOM is fully loaded before executing
document.addEventListener('DOMContentLoaded', function () {
    const chatLog = document.getElementById('chat-log');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const veryBasicButton = document.getElementById('very-basic-button');
    const basicButton = document.getElementById('basic-button');
    const rulesButton = document.getElementById('rules-button');
    const learnMoreButton = document.getElementById('learn-more-button');

    let knowledgeBase = {};

    // Load Stemmer Library (PorterStemmer from natural.js)
    function stemmer(word) {
        return word.replace(/(ing|ed|ly|es|s)$/, ''); // Simple stemmer fallback
    }

    // Hardcoded responses for buttons
    const hardcodedResponses = {
        "Very Basic Chess": {
            response: "Welcome to the very basics of Chess!\nIn chess, two players face off to capture each other's king.\nThe pieces are:\n- King\n- Queen\n- Rooks\n- Knights\n- Bishops\n- Pawns\nLet's start by learning how each piece moves!"
        },
        "Basic Chess": {
            response: "Welcome to the basic chess lesson!\nIn chess, each piece has a unique way of moving:\n1. King: Moves one square in any direction.\n2. Queen: Moves in any direction (horizontal, vertical, diagonal).\n3. Rook: Moves vertically or horizontally any number of squares.\n4. Bishop: Moves diagonally any number of squares.\n5. Knight: Moves in an L-shape (two squares in one direction, one square perpendicular).\n6. Pawn: Moves forward one square, but captures diagonally."
        },
        "Chess Rules": {
            response: "Basic Chess Rules:\n1. Each player starts with 16 pieces: 8 pawns, 2 rooks, 2 knights, 2 bishops, 1 queen, and 1 king.\n2. The objective is to checkmate the opponent's king (put it in a position where it can't escape capture).\n3. The game starts with each player moving their pieces in alternating turns.\n4. Castling, en passant, and pawn promotion are special rules."
        }
    };

    // Fetch the knowledge base from an external JSON file
    fetch('chess_knowledge.json')
        .then(response => response.json())
        .then(data => {
            knowledgeBase = data;
            console.log("Knowledge base loaded successfully!");
        })
        .catch(error => console.error('Error loading knowledge base:', error));

    // Function to add a bot message to chat
    function addBotMessage(message, url = null, url2 = null) {
        const botMessage = document.createElement('div');
        botMessage.className = 'bot-message';
        botMessage.innerHTML = `<span class="bot-icon">🤖</span><p>${message}</p>`;
        chatLog.appendChild(botMessage);

        if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.textContent = 'Click here to learn more';
            console.log("\n");
            link.target = '_blank';
            link.className = 'chat-link';
            chatLog.appendChild(link);

            const space = document.createElement('div');
            space.style.marginBottom = "10px"; // Adjust spacing as needed
            chatLog.appendChild(space);
        }
        
        if (url2) {
            const link2 = document.createElement('a');
            link2.href = url2;
            link2.textContent = 'Click here to practice';
            link2.target = '_blank';
            link2.className = 'chat-link';
            chatLog.appendChild(link2);
        }

        scrollChatToBottom();
    }

    // Function to add a user message to chat
    function addUserMessage(message) {
        const userMessage = document.createElement('div');
        userMessage.className = 'user-message';
        userMessage.textContent = message;
        chatLog.appendChild(userMessage);
        scrollChatToBottom();
    }

    function scrollChatToBottom() {
        setTimeout(() => {
            chatLog.scrollTop = chatLog.scrollHeight;
        }, 50);
    }
    
    console.log(chatLog.scrollTop, chatLog.scrollHeight);
    
    // Handle user input
    function handleUserInput() {
        const input = userInput.value.trim();
        if (input) {
            addUserMessage(input);
            const response = getBotResponse(input);
            addBotMessage(response.response, response.url, response.url2);
            userInput.value = '';
        }
    }

    // Get bot response based on user input
    function getBotResponse(input) {
        // Step 1: Extract noun phrases using Compromise
        let doc = nlp(input);
        let nounPhrases = doc.nouns().out('array');  // Extract nouns like "pawn move", "king movement"

        if (nounPhrases.length === 0) {
            nounPhrases = [input.toLowerCase()];  // Fallback to original input if no noun phrases found
        }

        // Step 2: Check for exact matches in knowledge base
        for (const [category, data] of Object.entries(knowledgeBase)) {
            for (const keyword of data.keywords) {
                if (nounPhrases.includes(keyword.toLowerCase())) {
                    return data; // Exact match found
                }    
            }
        }

        // Step 3: Fuzzy match using Fuse.js
        const fuse = new Fuse(Object.keys(knowledgeBase), { includeScore: true, threshold: 0.4 });
        const fuzzyResult = fuse.search(nounPhrases.join(" "));

        if (fuzzyResult.length > 0) {
            return knowledgeBase[fuzzyResult[0].item]; // Best fuzzy match
        }

        // Step 4: If no match, suggest related topics
        const randomTopics = Object.keys(knowledgeBase).sort(() => 0.5 - Math.random()).slice(0, 3);
        return {
            response: `I didn't quite get that. Maybe try asking about: ${randomTopics.join(", ")}.`,
        };
    }

    // Button event listeners
    veryBasicButton.addEventListener('click', function () {
        addBotMessage(hardcodedResponses["Very Basic Chess"].response);
    });

    basicButton.addEventListener('click', function () {
        addBotMessage(hardcodedResponses["Basic Chess"].response);
    });

    rulesButton.addEventListener('click', function () {
        addBotMessage(hardcodedResponses["Chess Rules"].response);
    });

    learnMoreButton.addEventListener('click', function () {
        window.open('https://jyothsna-l.github.io/Chess-Edu/', '_blank');
    });

    // Send button and Enter key handling
    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });
});
