export const CardState = {
    Learned: Symbol('learned'),
    Notlearned: Symbol('notlearned'),
    NotTriedYet: Symbol('notTriedYet')
};

export const getCardState = (card) => {
    if (!card.successfulAttempts.length && !card.failedAttempts.length) {
        return CardState.NotTriedYet;
    } else if (!card.successfulAttempts.length || card.failedAttempts[0] > card.successfulAttempts[0]) {
        return CardState.Notlearned;
    } else {
        return CardState.Learned;
    }
}


