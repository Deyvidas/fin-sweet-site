import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

function feedbackSwiper() {
    return new Swiper('.feedback-swiper', {
        modules: [Navigation],
        slidePrevClass: 'feedback-swiper__slide-prev',
        slideNextClass: 'feedback-swiper__slide-next',
        slideActiveClass: 'feedback-swiper__slide-active',
        navigation: {
            prevEl: '.feedback-swiper__button--prev',
            nextEl: '.feedback-swiper__button--next',
            disabledClass: 'feedback-swiper__button--disabled',
        },
    });
}

export { feedbackSwiper };
