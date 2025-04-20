interface CarouselIndicatorProps {
    count: number;
    currentIndex: number;
    onClick: (index: number) => void;
}
export default function CarouselIndicator({ count, currentIndex, onClick }: CarouselIndicatorProps) {
  return (
    <div className="flex justify-center mt-4">
        {Array.from({ length: count }).map((_, index) => (
            <button
            key={index}
            className={`w-2 h-2 mx-1 rounded-full ${currentIndex === index ? 'opacity-100' : 'opacity-40'} bg-blancasi-500 hover:opacity-80 transition duration-300`}
            onClick={() => onClick(index)}
            aria-label={`Slide ${index + 1}`}
            />
        ))}
    </div>
  )
}

