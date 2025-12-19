import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function AdminLineRequests() {
    const { lineRequests, subsidiaries, lineTypes, createLineRequest, deleteLineRequest, users, user } = useApp();
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedType, setSelectedType] = useState("");
    const [selectedSubsidiary, setSelectedSubsidiary] = useState("");

    const handleCreate = async () => {
        if (!selectedType || !selectedSubsidiary || !user) {
            toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
            return;
        }

        const success = await createLineRequest(selectedType, selectedSubsidiary, user.id);
        if (success) {
            toast({ title: "Success", description: "Line request created" });
            setIsDialogOpen(false);
            setSelectedType("");
            setSelectedSubsidiary("");
        } else {
            toast({ title: "Error", description: "Failed to create request", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this request?")) {
            const success = await deleteLineRequest(id);
            if (success) {
                toast({ title: "Success", description: "Request deleted" });
            } else {
                toast({ title: "Error", description: "Failed to delete request", variant: "destructive" });
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'rejected': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
        }
    };

    const getSubName = (id: string) => subsidiaries.find(s => s.id === id)?.name || "Unknown";
    const getAdminName = (id: string) => users.find(u => u.id === id)?.name || "Unknown";

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Line Requests</h1>
                    <p className="text-muted-foreground">Manage requests for new line numbers</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request New Line</DialogTitle>
                            <DialogDescription>Submit a request to maintenance for a new line allocation.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Requested Line Type</Label>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lineTypes.map(type => (
                                            <SelectItem key={type.code} value={type.code}>{type.title} ({type.code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Subsidiary</Label>
                                <Select value={selectedSubsidiary} onValueChange={setSelectedSubsidiary}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subsidiary" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subsidiaries.map(sub => (
                                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate}>Submit Request</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Request History</CardTitle>
                    <CardDescription>View status of all line requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Requested Type</TableHead>
                                <TableHead>Assigned Number</TableHead>
                                <TableHead>Subsidiary</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Response</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No requests found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                lineRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{format(new Date(req.createdAt), 'MMM d, yyyy')}</TableCell>
                                        <TableCell><Badge variant="outline">{req.requestedType}</Badge></TableCell>
                                        <TableCell className="font-mono font-bold">{req.assignedNumber || '-'}</TableCell>
                                        <TableCell>{getSubName(req.subsidiaryId)}</TableCell>
                                        <TableCell>{getAdminName(req.adminId)}</TableCell>
                                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {req.rejectionReason && (
                                                <span className="text-red-500">Reason: {req.rejectionReason}</span>
                                            )}
                                            {req.respondedAt && !req.rejectionReason && (
                                                <span>Processed on {format(new Date(req.respondedAt), 'MMM d')}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={(e) => handleDelete(req.id, e)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
