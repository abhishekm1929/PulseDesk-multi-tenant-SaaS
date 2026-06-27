import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function TicketDetail() {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);

    useEffect(() => {
        api.get(`/tickets/${id}`)
            .then(res => setTicket(res.data))
            .catch(err => console.log(err));
    }, [id]);

    if (!ticket) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">
                {ticket.subject}
            </h1>

            <p className="mt-4">
                {ticket.description}
            </p>

            <div className="mt-4">
                <b>Status:</b> {ticket.status}
            </div>

            <div>
                <b>Priority:</b> {ticket.priority}
            </div>

            <div className="mt-6">
                Comments
                {ticket.comments?.map(comment => (
                    <div key={comment.id} className="border p-2 mt-2">
                        <b>{comment.user?.name}</b>
                        <p>{comment.body}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
