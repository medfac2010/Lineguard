import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState } from "react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminStatistics() {
  const { lines, faults, subsidiaries } = useApp();
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const getSubName = (subId: string) => subsidiaries.find(s => s.id === subId)?.name || "Unknown";
  
  const filterByDateRange = (faults: any[]) => {
    if (!startDate || !endDate) return faults;
    try {
      const start = startOfDay(parseISO(startDate));
      const end = endOfDay(parseISO(endDate));
      return faults.filter(f => {
        const faultDate = parseISO(f.declaredAt);
        return isWithinInterval(faultDate, { start, end });
      });
    } catch {
      return faults;
    }
  };

  const getAllStatistics = () => {
    const filteredFaults = filterByDateRange(faults);
    const totalFaults = filteredFaults.length;
    const resolvedFaults = filteredFaults.filter(f => f.status === 'resolved').length;
    const openFaults = filteredFaults.filter(f => f.status === 'open').length;
    const assignedFaults = filteredFaults.filter(f => f.status === 'assigned').length;

    return {
      totalLines: lines.length,
      totalFaults,
      resolvedFaults,
      openFaults,
      assignedFaults,
      resolutionRate: totalFaults > 0 ? Math.round((resolvedFaults / totalFaults) * 100) : 0,
    };
  };

  const getBySubsidiaryStatistics = () => {
    const filteredFaults = filterByDateRange(faults);
    return subsidiaries.map(sub => {
      const subLines = lines.filter(l => l.subsidiaryId === sub.id);
      const subFaults = filteredFaults.filter(f => subLines.some(l => l.id === f.lineId));
      const resolvedCount = subFaults.filter(f => f.status === 'resolved').length;
      
      return {
        id: sub.id,
        name: sub.name,
        totalLines: subLines.length,
        totalFaults: subFaults.length,
        resolved: resolvedCount,
        open: subFaults.filter(f => f.status === 'open').length,
        assigned: subFaults.filter(f => f.status === 'assigned').length,
        resolutionRate: subFaults.length > 0 ? Math.round((resolvedCount / subFaults.length) * 100) : 0,
      };
    });
  };

  const getByLineStatistics = () => {
    const filteredFaults = filterByDateRange(faults);
    return lines.map(line => {
      const lineFaults = filteredFaults.filter(f => f.lineId === line.id);
      const resolvedCount = lineFaults.filter(f => f.status === 'resolved').length;
      
      return {
        id: line.id,
        number: line.number,
        type: line.type,
        subsidiary: getSubName(line.subsidiaryId),
        location: line.location,
        status: line.status,
        totalFaults: lineFaults.length,
        resolved: resolvedCount,
        open: lineFaults.filter(f => f.status === 'open').length,
        assigned: lineFaults.filter(f => f.status === 'assigned').length,
      };
    });
  };

  const getByPeriodStatistics = () => {
    const filteredFaults = filterByDateRange(faults);
    const groupedByDate: { [key: string]: any } = {};

    filteredFaults.forEach(fault => {
      const date = format(parseISO(fault.declaredAt), "yyyy-MM-dd", { locale: fr });
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date, total: 0, resolved: 0, open: 0, assigned: 0 };
      }
      groupedByDate[date].total++;
      if (fault.status === 'resolved') groupedByDate[date].resolved++;
      if (fault.status === 'open') groupedByDate[date].open++;
      if (fault.status === 'assigned') groupedByDate[date].assigned++;
    });

    return Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
  };

  const allStats = getAllStatistics();
  const bySubsidiaryStats = getBySubsidiaryStatistics();
  const byLineStats = getByLineStatistics();
  const byPeriodStats = getByPeriodStatistics();

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-muted-foreground">Analyse détaillée des pannes et de la maintenance</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Sélectionnez la plage de dates pour filtrer les statistiques</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input 
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input 
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lignes totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allStats.totalLines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pannes totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{allStats.totalFaults}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Résolues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{allStats.resolvedFaults}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ouvertes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{allStats.openFaults}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de résolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{allStats.resolutionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pannes par filiale</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bySubsidiaryStats}
                  dataKey="totalFaults"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {bySubsidiaryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>État des filiales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bySubsidiaryStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalLines" fill="#3b82f6" name="Lignes" />
                <Bar dataKey="totalFaults" fill="#ef4444" name="Pannes" />
                <Bar dataKey="resolved" fill="#10b981" name="Résolues" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Pannes par filiale (Détail)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filiale</TableHead>
                  <TableHead>Lignes</TableHead>
                  <TableHead>Pannes totales</TableHead>
                  <TableHead>Résolues</TableHead>
                  <TableHead>Ouvertes</TableHead>
                  <TableHead>Assignées</TableHead>
                  <TableHead>Taux de résolution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bySubsidiaryStats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-medium">{stat.name}</TableCell>
                    <TableCell>{stat.totalLines}</TableCell>
                    <TableCell className="font-bold text-red-600">{stat.totalFaults}</TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">{stat.resolved}</Badge></TableCell>
                    <TableCell><Badge className="bg-orange-100 text-orange-800">{stat.open}</Badge></TableCell>
                    <TableCell><Badge className="bg-blue-100 text-blue-800">{stat.assigned}</Badge></TableCell>
                    <TableCell className="font-bold">{stat.resolutionRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pannes par ligne (Détail)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Filiale</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Pannes</TableHead>
                  <TableHead>Résolues</TableHead>
                  <TableHead>Ouvertes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byLineStats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-mono font-medium">{stat.number}</TableCell>
                    <TableCell>{stat.type}</TableCell>
                    <TableCell>{stat.subsidiary}</TableCell>
                    <TableCell>{stat.location}</TableCell>
                    <TableCell>
                      <Badge variant={stat.status === 'working' ? 'default' : stat.status === 'faulty' ? 'destructive' : 'secondary'}>
                        {stat.status === 'working' ? 'Opérationnel' : stat.status === 'faulty' ? 'Panne' : 'Maintenance'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-red-600">{stat.totalFaults}</TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">{stat.resolved}</Badge></TableCell>
                    <TableCell><Badge className="bg-orange-100 text-orange-800">{stat.open}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Évolution des pannes au fil du temps</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={byPeriodStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#ef4444" name="Total" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Résolues" />
              <Line type="monotone" dataKey="open" stroke="#f59e0b" name="Ouvertes" />
              <Line type="monotone" dataKey="assigned" stroke="#3b82f6" name="Assignées" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Détail par date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Résolues</TableHead>
                  <TableHead>Ouvertes</TableHead>
                  <TableHead>Assignées</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byPeriodStats.map((stat) => (
                  <TableRow key={stat.date}>
                    <TableCell className="font-medium">{format(parseISO(stat.date), "PPP", { locale: fr })}</TableCell>
                    <TableCell className="font-bold text-red-600">{stat.total}</TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">{stat.resolved}</Badge></TableCell>
                    <TableCell><Badge className="bg-orange-100 text-orange-800">{stat.open}</Badge></TableCell>
                    <TableCell><Badge className="bg-blue-100 text-blue-800">{stat.assigned}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
