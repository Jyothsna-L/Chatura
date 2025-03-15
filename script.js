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
    let failedAttempts = 0;
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
    console.log(typeof nlp); 
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

    function getBotResponse(userInput) {
        userInput = userInput.toLowerCase().trim();
        let doc = nlp(userInput);
        let nounPhrases = doc.nouns().out('array'); // Extract noun phrases
        let tokens = userInput.split(/\s+/); // Tokenize input
        let stemmedTokens = tokens.map(word => lunr.stemmer(new lunr.Token(word)));


        // Step 1: Check for direct matches
        for (const [category, data] of Object.entries(knowledgeBase)) {
            for (const keyword of data.keywords) {
                if (nounPhrases.includes(keyword.toLowerCase()) || stemmedTokens.includes(stemmer(keyword.toLowerCase()))) {
                    failedAttempts = 0; // Reset failed attempts
                    return { response: data.response, url: data.url || null, url2: data.url2 || null };
                }
            }
        }
    
        // Step 2: Fuzzy Matching (Using Fuse.js)
        const fuse = new Fuse(Object.keys(knowledgeBase), { threshold: 0.6 }); // Adjust sensitivity if needed
        const fuzzyResult = fuse.search(userInput);
    
        if (fuzzyResult.length > 0) {
            let bestMatch = fuzzyResult[0].item;
            failedAttempts = 0; // Reset failed attempts
            return { response: knowledgeBase[bestMatch].response, url: knowledgeBase[bestMatch].url || null, url2: knowledgeBase[bestMatch].url2 || null };
        }
    
        // Step 3: Increase failed attempts and show suggestions
        failedAttempts++;
        let possibleSuggestions = fuse.search(userInput, { limit: 3 }).map(result => result.item);
        
        if (possibleSuggestions.length > 0) {
            showDidYouMeanPopup(possibleSuggestions);
            return { response: "I couldn't understand that... Could you try rephrasing?", url: null, url2: null };
        }
    
        // Step 4: If failed 3 times, suggest random topics
        if (failedAttempts >= 2) {
            failedAttempts = 0; // Reset counter
            let randomTopics = Object.keys(knowledgeBase).sort(() => 0.5 - Math.random()).slice(0, 6);
            showDidYouMeanPopup(randomTopics);
            return { response: `This might be beyond my scope. Try exploring these topics: ${randomTopics.join(", ")}`, url: null, url2: null };
        }
    
        return { response: "I couldn't understand that. Try rephrasing or typing the topic directly.", url: null, url2: null };
    }
    
    function showDidYouMeanPopup(suggestions) {
        console.log("Pop-up triggered:", suggestions);
    
        // Remove existing pop-up if any
        const existingPopup = document.querySelector(".popup-overlay");
        if (existingPopup) existingPopup.remove();
    
        // Create overlay
        let overlay = document.createElement("div");
        overlay.classList.add("popup-overlay");
    
        // Create pop-up content
        overlay.innerHTML = `
            <div class="popup-content">
                <h3>Did you mean?</h3>
                <h4>Type one of the topic name in the chat box to know more</h4>
                ${suggestions.map(topic => `<button class="suggestion-btn">${topic}</button>`).join("")}
                <button class="close-popup">Close</button>
            </div>
        `;
    
        // Append to chat container
        document.querySelector(".chat-container").appendChild(overlay);
    
        console.log("Pop-up added to DOM");
    
        // Add event listeners
        document.querySelectorAll(".suggestion-btn").forEach(button => {
            button.addEventListener("click", function () {
                handleUserInput(button.innerText);
                overlay.remove();
            });
        });
    
        document.querySelector(".close-popup").addEventListener("click", () => overlay.remove());
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
