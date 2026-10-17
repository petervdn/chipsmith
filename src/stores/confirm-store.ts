/**
 * The one question the page asks before a change (not persisted): what is asked, what the yes
 * button says, and the promise waiting for the answer. Anything asks with `askToConfirm`; the
 * dialog (dialog/ConfirmDialog.tsx) shows it and answers. It knows nothing of how it is shown.
 */
import { create } from 'zustand';

/** A question to confirm before a change. */
export type ConfirmQuestion = {
  /** What is asked, in a sentence or two. */
  question: string;
  /** What the button that goes ahead says ("Delete"). */
  answer: string;
  /** Whether going ahead takes something away, shown in the reject colour. */
  isDanger?: boolean;
};

/** The question asked, and how to ask and answer. */
type ConfirmStore = {
  asked: (ConfirmQuestion & { resolve: (isYes: boolean) => void }) | null;
  /** Asks a question; the promise gives true when it was confirmed. */
  askToConfirm: (question: ConfirmQuestion) => Promise<boolean>;
  /** Answers the question asked, and puts it away. */
  answerQuestion: (isYes: boolean) => void;
};

/** The confirm store. */
export const useConfirmStore = create<ConfirmStore>()((set, get) => ({
  asked: null,
  askToConfirm: (question) => {
    get().answerQuestion(false);
    return new Promise((resolve) => set({ asked: { ...question, resolve } }));
  },
  answerQuestion: (isYes) => {
    const { asked } = get();
    if (!asked) return;
    set({ asked: null });
    asked.resolve(isYes);
  },
}));

/**
 * Asks a question in the page's dialog before a change.
 *
 * @param question - What to ask, and what the button that goes ahead says.
 * @returns A promise of true when it was confirmed, false when not.
 */
export function askToConfirm(question: ConfirmQuestion): Promise<boolean> {
  return useConfirmStore.getState().askToConfirm(question);
}
