function questionOnClickHandler(this: HTMLDivElement, event: Event) {
    const wrapper = this.parentElement as HTMLDivElement;
    if (!wrapper) throw new Error(`Parent of ${this.className} not found`);
    wrapper.classList.toggle('faq-card--active');

    const answer = wrapper.querySelector<HTMLParagraphElement>('.faq-card__answer');
    if (!answer) throw new Error('The wrapper has no child .faq-card__answer');
    answer.hidden = !answer.hidden;
}

function faqCard() {
    const questions = document.querySelectorAll('.faq-card__heading');

    for (var question of questions) {
        question.addEventListener('click', questionOnClickHandler);
    }
}

export { faqCard };
