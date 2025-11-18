import Image from 'next/image';

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10">
      <Image
        alt="Background Pattern"
        src="/background.jpg"
        quality={100}
        fill
        priority
        sizes="100vw"
        style={{
          objectFit: 'cover',
        }}
      />
    </div>
  );
}
