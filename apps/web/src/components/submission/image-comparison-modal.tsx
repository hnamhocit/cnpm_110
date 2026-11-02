"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalSubmission: {
    id: string;
    title: string;
    authorName: string;
  };
  suspectedSubmission: {
    id: string;
    title: string;
    authorName: string;
  };
}

export default function ImageComparisonModal({
  isOpen,
  onClose,
  originalSubmission,
  suspectedSubmission,
}: ImageComparisonModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>So sánh bài dự thi nghi ngờ trùng lặp</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Bài dự thi gốc</h3>
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-xs text-muted-foreground">
                Mã: {originalSubmission.id}
              </p>
              <p className="text-sm font-medium">{originalSubmission.title}</p>
              <p className="text-xs text-muted-foreground">
                {originalSubmission.authorName}
              </p>
            </div>
            <img
              src="https://placehold.co/600x400?text=Anh+Goc"
              alt={originalSubmission.title}
              className="h-[400px] w-full rounded-md border object-contain"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Bài dự thi bị nghi ngờ</h3>
            <div className="space-y-2 rounded-md border bg-red-50 p-3">
              <p className="text-xs text-muted-foreground">
                Mã: {suspectedSubmission.id}
              </p>
              <p className="text-sm font-medium">{suspectedSubmission.title}</p>
              <p className="text-xs text-muted-foreground">
                {suspectedSubmission.authorName}
              </p>
            </div>
            <img
              src="https://placehold.co/600x400?text=Anh+Nghi+Ngo"
              alt={suspectedSubmission.title}
              className="h-[400px] w-full rounded-md border object-contain"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
