import { knowledgeTextBlocks } from "@/lib/knowledge-base";
export function KnowledgeBody({ body }: {
    body: string;
}) {
    return <div className="kb-prose">{knowledgeTextBlocks(body).map(block => block.heading ? <h2 id={block.id} key={block.id}>{block.text.slice(3)}</h2> : block.text.split("\n").every(line => line.startsWith("- ")) ? <ul id={block.id} key={block.id}>{block.text.split("\n").map((line, i) => <li key={i}>{line.slice(2)}</li>)}</ul> : <p id={block.id} key={block.id}>{block.text}</p>)}</div>;
}
