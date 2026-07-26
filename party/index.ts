import type * as Party from "partykit/server";

type ChatPayload = {
  type: "message";
  username: string;
  avatar: string;
  content: string;
  sentAt: string;
};

type SystemPayload = {
  type: "system";
  content: string;
};

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    const welcome: SystemPayload = { type: "system", content: "Connected to the room." };
    conn.send(JSON.stringify(welcome));
  }

  onMessage(message: string, sender: Party.Connection) {
    let payload: ChatPayload;
    try {
      payload = JSON.parse(message);
    } catch {
      return;
    }
    if (payload.type !== "message" || typeof payload.content !== "string" || !payload.content.trim()) {
      return;
    }

    // relay to everyone else in the room; the sender already renders its own
    // message optimistically, so it doesn't need an echo back.
    this.room.broadcast(JSON.stringify(payload), [sender.id]);
  }
}

Server satisfies Party.Worker;
