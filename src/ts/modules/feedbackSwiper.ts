import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

function feedbackSwiper() {
    return new Swiper('.feedback-swiper', {
        modules: [Navigation],
        navigation: {
            prevEl: '.feedback-swiper__button--prev',
            nextEl: '.feedback-swiper__button--next',
            disabledClass: 'feedback-swiper__button--disabled',
        },
    });
}

export { feedbackSwiper };
