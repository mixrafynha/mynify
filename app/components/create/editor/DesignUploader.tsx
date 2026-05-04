export default function DesignUploader({ setDesign }) {
  return (
    <div className="mt-6 border border-white/10 rounded-xl p-4">
      <p className="text-gray-400 mb-3">Upload design</p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setDesign(URL.createObjectURL(file));
        }}
      />
    </div>
  );
}