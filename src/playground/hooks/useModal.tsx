"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Modal from "../ui/Modal";

export default function useModal(): [
  ReactNode,
  (
    title: string,
    getContent: (onClose: () => void) => ReactNode,
    closeOnClickOutside?: boolean,
  ) => void,
] {
  const [modalContent, setModalContent] = useState<{
    title: string;
    content: ReactNode;
    closeOnClickOutside: boolean;
  } | null>(null);

  const onClose = useCallback(() => {
    setModalContent(null);
  }, []);

  const modal = useMemo(() => {
    if (modalContent === null) return null;
    const { title, content, closeOnClickOutside } = modalContent;
    return (
      <Modal
        title={title}
        onClose={onClose}
        closeOnClickOutside={closeOnClickOutside}
      >
        {content}
      </Modal>
    );
  }, [modalContent, onClose]);

  const showModal = useCallback(
    (
      title: string,
      getContent: (onClose: () => void) => ReactNode,
      closeOnClickOutside = false,
    ) => {
      setModalContent({
        closeOnClickOutside,
        content: getContent(onClose),
        title,
      });
    },
    [],
  );

  return [modal, showModal];
}
