import { COUNTRY_QUESTIONS } from './countryQuestions';
import { PROVERBS_QUESTIONS } from './proverbsQuestions';
import { QuizQuestion } from '../types/game';

export const IRAQI_QUESTIONS: QuizQuestion[] = [
  ...PROVERBS_QUESTIONS,
  ...COUNTRY_QUESTIONS,
];

export { COUNTRY_QUESTIONS, PROVERBS_QUESTIONS };
