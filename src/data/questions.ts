import { COUNTRY_QUESTIONS } from './countryQuestions';
import { EXPANDED_IRAQI_QUESTIONS } from './expandedIraqiQuestions';
import { PROVERBS_QUESTIONS as BASE_PROVERBS_QUESTIONS } from './proverbsQuestions';
import { QuizQuestion } from '../types/game';

export const PROVERBS_QUESTIONS: QuizQuestion[] = [
  ...BASE_PROVERBS_QUESTIONS,
  ...EXPANDED_IRAQI_QUESTIONS,
];

export const IRAQI_QUESTIONS: QuizQuestion[] = [
  ...PROVERBS_QUESTIONS,
  ...COUNTRY_QUESTIONS,
];

export { COUNTRY_QUESTIONS, EXPANDED_IRAQI_QUESTIONS };
