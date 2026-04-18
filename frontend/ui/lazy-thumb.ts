function toThumbUrl(src: string): string {
	return src.replace("/uploads/full/", "/uploads/f460x345/");
}

let io: IntersectionObserver | null = null;

function getIO(): IntersectionObserver {
	if (!io) {
		io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const img = entry.target as HTMLImageElement;
					if (entry.isIntersecting) {
						const src = img.dataset.src;
						if (src && !img.src) {
							img.src = src;
						}
					}
				}
			},
			{ rootMargin: "300px 0px" },
		);
	}
	return io;
}

export function LazyThumb({
	src,
	className = "",
}: {
	src: string;
	className?: string;
}): HTMLElement {
	const wrapper = document.createElement("div");
	wrapper.className = className;

	const img = document.createElement("img");
	img.dataset.src = toThumbUrl(src);
	img.alt = "";
	img.referrerPolicy = "no-referrer";
	img.loading = "lazy";
	img.className =
		"w-full h-full object-cover opacity-0 transition-opacity duration-400";

	img.addEventListener(
		"load",
		() => {
			img.classList.remove("opacity-0");
			img.classList.add("opacity-100");
			getIO().unobserve(img);
		},
		{ once: true },
	);

	img.addEventListener(
		"error",
		() => {
			wrapper.style.display = "none";
			getIO().unobserve(img);
		},
		{ once: true },
	);

	wrapper.appendChild(img);
	getIO().observe(img);

	return wrapper;
}
