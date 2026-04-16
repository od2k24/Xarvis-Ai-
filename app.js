async function scoreIdea() {
    const idea = document.getElementById("ideaInput").value;

    const res = await fetch("http://localhost:3000/score", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ idea })
    });

    const data = await res.json();

    document.getElementById("result").innerHTML =
        `Score: ${data.score} <br> Verdict: ${data.verdict}`;
}
