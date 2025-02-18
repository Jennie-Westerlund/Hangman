document.addEventListener("DOMContentLoaded", () => {
    const keyboard = document.getElementById("keyboard");

    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const button = document.createElement("button");
        button.classList.add("letter-button");
        button.setAttribute("data-letter", letter);
        button.textContent = letter;
        keyboard.appendChild(button);
    }

    // Get the messages container
    const messages = document.getElementById("messages");

    // Get all buttons and add click event listeners
    const buttons = document.getElementsByClassName("letter-button");

    for (let btn of buttons) {
        btn.addEventListener("click", function () {
            const clickedButtonValue = this.getAttribute("data-letter");
            messages.textContent = `You clicked: ${clickedButtonValue}`;
        });
    }
});
