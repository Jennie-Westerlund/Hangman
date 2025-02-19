export function getRandomWord(wordsArray) {
    const randWord = wordsArray[Math.floor(Math.random() * wordsArray.length)];
    return randWord;
}