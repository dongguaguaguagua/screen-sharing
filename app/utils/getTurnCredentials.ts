export async function getTurnCredentials() {
    try {
        const response = await fetch("/api/turn");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching TURN credentials:", error);
        return null;
    }
}
