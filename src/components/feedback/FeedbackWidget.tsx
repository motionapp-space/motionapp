import { useState } from "react";
import { FeedbackButton } from "./FeedbackButton";
import { FeedbackModal } from "./FeedbackModal";

export function FeedbackWidget() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <FeedbackButton onClick={() => setIsModalOpen(true)} />
      <FeedbackModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
