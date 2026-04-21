export default function MNISTTraining() {
  return (
    <div
      className="rounded-md border p-5 text-sm"
      style={{
        backgroundColor: "var(--bg-raised)",
        borderColor: "var(--border-subtle)",
        color: "var(--text-secondary)",
      }}
    >
      In-browser MNIST training was removed in v3. CIFAR-10 training is performed
      in Colab, and the stand replays saved real-run JSON on Step 10.
    </div>
  );
}
