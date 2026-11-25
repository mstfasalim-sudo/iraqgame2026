import { IRAQI_QUESTIONS } from '../data/questions';
import {
  AudiencePollResult,
  DifficultyTier,
  GameMode,
  OPTION_LETTERS,
  PhoneFriendResult,
  QuizQuestion,
} from '../types/game';

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Shuffles the 4 options of a question so the correct answer position
 * is randomized every playthrough while preserving correctIndex.
 */
function randomizeOptions(q: QuizQuestion): QuizQuestion {
  const indexed = q.options.map((text, idx) => ({
    text,
    isCorrect: idx === q.correctIndex,
  }));
  const shuffled = shuffleArray(indexed);
  const newCorrectIndex = shuffled.findIndex((item) => item.isCorrect) as 0 | 1 | 2 | 3;

  return {
    ...q,
    options: [shuffled[0].text, shuffled[1].text, shuffled[2].text, shuffled[3].text],
    correctIndex: newCorrectIndex,
  };
}

export function buildGameDeck(mode: GameMode): {
  deck: QuizQuestion[];
  reserve: QuizQuestion[];
} {
  const pool =
    mode === 'mixed'
      ? IRAQI_QUESTIONS
      : IRAQI_QUESTIONS.filter((q) => q.domain === mode);

  const easyPool = shuffleArray(pool.filter((q) => q.difficulty === 1));
  const medPool = shuffleArray(pool.filter((q) => q.difficulty === 2));
  const hardPool = shuffleArray(pool.filter((q) => q.difficulty === 3));

  const selectedEasy = easyPool.slice(0, 5).map(randomizeOptions);
  const selectedMed = medPool.slice(0, 5).map(randomizeOptions);
  const selectedHard = hardPool.slice(0, 5).map(randomizeOptions);

  const reserve = [
    ...easyPool.slice(5),
    ...medPool.slice(5),
    ...hardPool.slice(5),
  ].map(randomizeOptions);

  return {
    deck: [...selectedEasy, ...selectedMed, ...selectedHard],
    reserve,
  };
}

export function pickReplacementQuestion(
  difficulty: DifficultyTier,
  reserve: QuizQuestion[],
  usedIds: Set<string>,
  mode: GameMode
): { replacement: QuizQuestion | null; nextReserve: QuizQuestion[] } {
  const exactIdx = reserve.findIndex(
    (q) => q.difficulty === difficulty && !usedIds.has(q.id)
  );
  if (exactIdx !== -1) {
    const replacement = reserve[exactIdx];
    const nextReserve = reserve.filter((_, i) => i !== exactIdx);
    return { replacement, nextReserve };
  }

  // Fallback to same mode first, then full bank
  const modePool = IRAQI_QUESTIONS.filter(
    (q) =>
      (mode === 'mixed' || q.domain === mode) &&
      q.difficulty === difficulty &&
      !usedIds.has(q.id)
  );
  const fallbackPool =
    modePool.length > 0
      ? modePool
      : IRAQI_QUESTIONS.filter(
          (q) => q.difficulty === difficulty && !usedIds.has(q.id)
        );

  if (fallbackPool.length > 0) {
    const picked = randomizeOptions(
      fallbackPool[Math.floor(Math.random() * fallbackPool.length)]
    );
    return { replacement: picked, nextReserve: reserve };
  }

  return { replacement: null, nextReserve: reserve };
}

export function simulateAudiencePoll(
  question: QuizQuestion,
  eliminatedIndices: number[]
): AudiencePollResult {
  const activeIndices = [0, 1, 2, 3].filter((i) => !eliminatedIndices.includes(i));
  const percentages: [number, number, number, number] = [0, 0, 0, 0];

  const correctShareRange =
    question.difficulty === 1
      ? [72, 86]
      : question.difficulty === 2
        ? [52, 68]
        : [38, 56];

  const min = correctShareRange[0];
  const max = correctShareRange[1];
  const correctPct = Math.floor(Math.random() * (max - min + 1)) + min;
  percentages[question.correctIndex] = correctPct;

  const wrongActive = activeIndices.filter((i) => i !== question.correctIndex);
  let remaining = 100 - correctPct;

  wrongActive.forEach((idx, i) => {
    if (i === wrongActive.length - 1) {
      percentages[idx] = remaining;
    } else {
      const maxSlice = Math.max(2, remaining - (wrongActive.length - i - 1));
      const slice = Math.floor(Math.random() * maxSlice);
      percentages[idx] = Math.max(2, slice);
      remaining -= percentages[idx];
    }
  });

  const sum = percentages.reduce((acc, v) => acc + v, 0);
  if (sum !== 100) {
    percentages[question.correctIndex] += 100 - sum;
  }

  return { percentages };
}

const IRAQI_FRIENDS = [
  { name: 'أبو علي', city: 'بغداد — الكرادة' },
  { name: 'د. سارة', city: 'بغداد — المنصور' },
  { name: 'الحجي كاظم', city: 'النجف الأشرف' },
  { name: 'أحمد العزاوي', city: 'البصرة' },
  { name: 'أم مصطفى', city: 'الموصل' },
  { name: 'كاكا شيروان', city: 'أربيل' },
];

export function simulatePhoneFriend(
  question: QuizQuestion,
  eliminatedIndices: number[]
): PhoneFriendResult {
  const friend = IRAQI_FRIENDS[Math.floor(Math.random() * IRAQI_FRIENDS.length)];
  const activeWrong = [0, 1, 2, 3].filter(
    (i) => i !== question.correctIndex && !eliminatedIndices.includes(i)
  );

  const accuracyProb =
    question.difficulty === 1 ? 0.95 : question.difficulty === 2 ? 0.85 : 0.72;
  const isRight = Math.random() < accuracyProb;
  const suggestedIndex = isRight
    ? question.correctIndex
    : activeWrong[Math.floor(Math.random() * activeWrong.length)] ??
      question.correctIndex;

  const letter = OPTION_LETTERS[suggestedIndex];
  const optionText = question.options[suggestedIndex];

  const confidence =
    question.difficulty === 1
      ? 94
      : question.difficulty === 2
        ? isRight
          ? 80
          : 64
        : isRight
          ? 68
          : 54;

  const message =
    question.difficulty === 1
      ? `هلا والله! هذا السؤال سهل ومعروف عندنا، متأكد تقريباً إن الجواب هو (${letter}) «${optionText}». توكّل على الله واختاره.`
      : question.difficulty === 2
        ? `ألو، شلونك عيوني؟ سؤال حلو والله! حسب معلوماتي أقرب جواب صحيح هو (${letter}) «${optionText}»، وإن شاء الله يطلع صح.`
        : `يا هلا بيك، والله هذا السؤال شوية صعب ويرادله تركيز! أميل أكثر للخيار (${letter}) «${optionText}»، بس هم فكّر بيه زين.`;

  return {
    friendName: friend.name,
    city: friend.city,
    message,
    suggestedIndex,
    confidence,
  };
}
