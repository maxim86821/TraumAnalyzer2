import DreamForm from "@/components/DreamForm";

export default function NewDream() {
  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-800 mb-6">
        Neuen Traum erfassen
      </h1>
      <DreamForm />
    </div>
  );
}
