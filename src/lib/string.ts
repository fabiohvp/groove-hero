export function normalizeForSearch(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

export function safeFilePath(filePath: string) {
	const parts = filePath.split(/[/\\]/);
	const name = parts.pop() || "";

	const extMatch = name.match(/\.[^.]+$/);
	const ext = extMatch ? extMatch[0] : "";

	const base = name
		.replace(ext, "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	const safeName = base + ext.toLowerCase();

	return [...parts, safeName].join("/");
}