import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function AdminHistory() {
  const { faults, lines, subsidiaries, users } = useApp();

  const completedTasks = faults.filter(f => f.status === 'resolved');

  const getLineDetails = (lineId: string) => lines.find(l => l.id === lineId);
  const getSubName = (subId: string) => subsidiaries.find(s => s.id === subId)?.name;
  const getUserName = (userId?: string) => userId ? users.find(u => u.id === userId)?.name : 'Unknown';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historique des interventions</h1>
        <p className="text-muted-foreground">Archive de toutes les pannes résolues et les actions de maintenance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Problèmes résolus</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date de résolution</TableHead>
                <TableHead>Filiale</TableHead>
                <TableHead>Ligne</TableHead>
                <TableHead>Problème</TableHead>
                <TableHead>Assigné à</TableHead>
                <TableHead>Retour utilisateur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun historique disponible.
                  </TableCell>
                </TableRow>
              ) : (
                completedTasks.map((fault) => {
                  const line = getLineDetails(fault.lineId);
                  return (
                    <TableRow key={fault.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {fault.resolvedAt ? format(new Date(fault.resolvedAt), "dd/MM/yyyy HH:mm") : '-'}
                      </TableCell>
                      <TableCell>{getSubName(fault.subsidiaryId)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        <div>{line?.number}</div>
                        <div className="text-muted-foreground">{line?.type} - {line?.location}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="font-medium truncate" title={fault.symptoms}>{fault.symptoms}</div>
                        <div className="text-xs text-muted-foreground truncate" title={fault.probableCause}>Cause probable: {fault.probableCause}</div>
                      </TableCell>
                      <TableCell>{getUserName(fault.assignedTo)}</TableCell>
                      <TableCell className="text-sm italic text-muted-foreground">{fault.feedback || 'Aucun retour'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
