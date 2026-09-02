import { ArrowLeft, CheckCircle2, CirclePlay, Video, XCircle } from "lucide-react";
import { useNavigate } from "react-router";

type ReviewStatus = "correct" | "wrong";

type ReviewItem = {
  questionNumber: number;
  question: string;
  status: ReviewStatus;
  answerType: "image" | "text";
  answer?: string;
  answerImage?: string;
  attemptImage?: string;
  referenceImage?: string;
  referenceVideo?: string;
  referenceText?: string;
};

const reviewItems: ReviewItem[] = [
  {
    questionNumber: 1,
    question: "Which is 5?",
    status: "correct",
    answerType: "image",
    answerImage: "/images/number-5.png",
  },
  {
    questionNumber: 2,
    question: "Sign the number 7",
    status: "wrong",
    answerType: "image",
    attemptImage: "/images/my-attempt.png",
    referenceImage: "/images/correct-sign.png",
  },
  {
    questionNumber: 3,
    question: "What sign is this?",
    status: "correct",
    answerType: "text",
    answer: '"Ten"',
    answerImage: "/images/ten-sign.png",
  },
];

const AssessmentResultPage = () => {
  const navigate = useNavigate();

  const score = 8;
  const totalItems = 10;
  const percentage = Math.round((score / totalItems) * 100);

  return (
    <div className="min-h-dvh  font-body text-[#111827]">
      <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-5 flex items-center  gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#555] shadow-sm transition hover:bg-gray-100"
          >
            <ArrowLeft className="size-4" />
          </button>

          <h1 className="text-lg font-extrabold sm:text-xl">
            Review Results
          </h1>
        </header>

        {/* ================= SCORE SUMMARY ================= */}
        <section className="relative mb-6 overflow-hidden rounded-2xl border-b-[6px] border-[#cc960d] bg-gradient-to-r from-[#ffc13f] to-[#ffd875] px-5 py-5 shadow-[0_3px_8px_rgb(0_0_0/0.12)] sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {/* Label */}
              <div className="mb-2 flex items-center gap-1 text-[10px] font-extrabold uppercase text-white">
                <span>◎</span>
                <span>Great job!</span>
              </div>

              {/* Score */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {percentage}%
                </span>

                <span className="text-sm font-extrabold text-[#8a6810]">
                  {score}/{totalItems}
                </span>
              </div>

              <p className="mt-3 max-w-md text-xs font-medium leading-5 text-[#664d12]">
                You're getting so fast at signing numbers! Let's check out
                what you learned.
              </p>
            </div>

            {/* Celebration image */}
            <div className="flex justify-center sm:justify-end">
              <img
                src="/images/quiz-complete.png"
                alt=""
                className="h-24 w-28 rounded-sm object-cover shadow-[0_3px_7px_rgb(0_0_0/0.12)] sm:h-28 sm:w-36"
              />
            </div>
          </div>
        </section>

        {/* ================= REVIEW ITEMS ================= */}
        <section className="space-y-3">
          {reviewItems.map((item) => {
            const isCorrect = item.status === "correct";

            return (
              <article
                key={item.questionNumber}
                className={`overflow-hidden rounded-xl border-2 bg-white shadow-[0_2px_4px_rgb(0_0_0/0.05)] ${
                  isCorrect
                    ? "border-[#4caf50]"
                    : "border-[#df2424]"
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
                  <div className="min-w-0">
                    {/* Status */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold text-white ${
                        isCorrect
                          ? "bg-[#4caf50]"
                          : "bg-[#cf1717]"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <XCircle className="size-3" />
                      )}

                      {isCorrect ? "Correct" : "Needs Practice"}
                    </span>

                    {/* Question */}
                    <h2 className="mt-2 text-xs font-extrabold sm:text-sm">
                      Question {item.questionNumber}: {item.question}
                    </h2>
                  </div>

                  {/* Replay */}
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#0674bb] px-3 py-2 text-[9px] font-extrabold text-white shadow-[0_2px_0_#00538b] transition hover:bg-[#0969a7] sm:text-[10px]"
                  >
                    <CirclePlay className="size-3" />
                    Re-play Reference
                  </button>
                </div>

                {/* ================= CORRECT ================= */}
                {isCorrect && (
                  <div className="mx-3 mb-3 rounded-lg bg-[#eef0f2] p-2.5 sm:mx-4 sm:mb-4 sm:p-3">
                    <div className="flex items-center gap-3">
                      {/* Answer image */}
                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-[#4caf50] bg-white sm:size-14">
                        {item.answerImage ? (
                          <img
                            src={item.answerImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold">✓</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[8px] font-extrabold uppercase tracking-wider text-[#555]">
                          Your Answer
                        </p>

                        {item.answerType === "text" && item.answer && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-[#55a956] bg-white px-2 py-1 text-[9px] font-bold text-[#25652a]">
                            {item.answer}
                            <CheckCircle2 className="size-3" />
                          </span>
                        )}

                        {item.answerType === "image" && (
                          <p className="mt-1 text-[8px] font-medium text-[#555]">
                            Image option
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= WRONG ================= */}
                {!isCorrect && (
                  <div className="mx-3 mb-3 grid grid-cols-1 gap-2 sm:mx-4 sm:mb-4 sm:grid-cols-2">
                    {/* Attempt */}
                    <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-[#f3b5b5] bg-[#fff5f4] p-3">
                      {item.attemptImage ? (
                        <div className="flex w-full items-center gap-3">
                          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
                            <img
                              src={item.attemptImage}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div>
                            <p className="text-[8px] font-extrabold uppercase text-[#bb2525]">
                              Your Attempt
                            </p>

                            <p className="mt-1 text-[9px] font-semibold text-[#777]">
                              Not Recognized
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <Video className="size-5 text-[#cf2222]" />
                          <p className="mt-1 text-[8px] font-extrabold uppercase text-[#cf2222]">
                            Your Attempt
                          </p>
                          <p className="text-[8px] text-[#777]">
                            Not Recognized
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Correct reference */}
                    <div className="relative min-h-20 overflow-hidden rounded-lg bg-[#eee]">
                      {item.referenceImage ? (
                        <img
                          src={item.referenceImage}
                          alt="Correct reference"
                          className="h-full min-h-20 w-full object-cover"
                        />
                      ) : (
                        <div className="flex min-h-20 items-center justify-center">
                          <span className="text-xs text-gray-500">
                            Reference
                          </span>
                        </div>
                      )}

                      {/* Play button */}
                      <button
                        type="button"
                        aria-label="Play reference"
                        className="absolute inset-0 m-auto flex size-10 items-center justify-center rounded-full bg-white/90 shadow-md"
                      >
                        <CirclePlay className="size-6 fill-[#ffc145] text-[#f0a800]" />
                      </button>

                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-extrabold text-[#777]">
                        CORRECT SIGN
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default AssessmentResultPage;