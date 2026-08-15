import { readUploadedImage } from "@/features/upload/useUpload";

type DesignUploaderProps = {
  setDesign: (url: string) => void;
};

export default function DesignUploader({ setDesign }: DesignUploaderProps) {
  return (
    <div className="mt-6 border border-white/10 rounded-xl p-4">
      <p className="text-gray-400 mb-3">Upload design</p>

      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;

          try {
            const uploaded = await readUploadedImage(file);
            setDesign(uploaded.url);
          } catch {
            // Keep the component lightweight; caller can decide how to surface errors.
          }
        }}
      />
    </div>
  );
}
