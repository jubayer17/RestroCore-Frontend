import { useRestaurantStore } from '@/store/useRestaurantStore';
import type { Table, TableStatus, TableShape } from '@/types/restaurant';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Grid3X3, Filter, Armchair, LayoutGrid, Move, Lock, Unlock, ZoomIn, ZoomOut, RotateCcw, Plus, X, Trash2, Undo2, Redo2, Edit2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Undo/Redo history hook for table snapshots
function useTableHistory(tables: Table[]) {
  const undoStack = useRef<Table[][]>([]);
  const redoStack = useRef<Table[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushSnapshot = useCallback((snapshot: Table[]) => {
    undoStack.current.push(snapshot.map(t => ({ ...t })));
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback((): Table[] | null => {
    if (undoStack.current.length === 0) return null;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(tables.map(t => ({ ...t })));
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
    return prev;
  }, [tables]);

  const redo = useCallback((): Table[] | null => {
    if (redoStack.current.length === 0) return null;
    const next = redoStack.current.pop()!;
    undoStack.current.push(tables.map(t => ({ ...t })));
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    return next;
  }, [tables]);

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}

const statusConfig: Record<TableStatus, { bg: string; label: string; dot: string; canvasBg: string; canvasBorder: string }> = {
  free: { bg: 'bg-fresh/10 border-fresh/30', label: 'Available', dot: 'bg-fresh', canvasBg: 'hsl(var(--fresh) / 0.15)', canvasBorder: 'hsl(var(--fresh) / 0.6)' },
  reserved: { bg: 'bg-gold/10 border-gold/30', label: 'Reserved', dot: 'bg-gold', canvasBg: 'hsl(var(--gold) / 0.15)', canvasBorder: 'hsl(var(--gold) / 0.6)' },
  occupied: { bg: 'bg-primary/10 border-primary/30', label: 'Occupied', dot: 'bg-primary', canvasBg: 'hsl(var(--primary) / 0.15)', canvasBorder: 'hsl(var(--primary) / 0.6)' },
  dirty: { bg: 'bg-destructive/10 border-destructive/20', label: 'Dirty', dot: 'bg-destructive', canvasBg: 'hsl(var(--destructive) / 0.15)', canvasBorder: 'hsl(var(--destructive) / 0.5)' },
  cleaning: { bg: 'bg-warning/10 border-warning/30', label: 'Cleaning', dot: 'bg-warning', canvasBg: 'hsl(var(--warning) / 0.15)', canvasBorder: 'hsl(var(--warning) / 0.6)' },
};

const CANVAS_W = 1200;
const CANVAS_H = 800;
const TABLE_SIZE = 80;

export default function Tables() {
  const { tables, updateTableStatus, updateTablePosition, addTable, deleteTable, updateTableProps, setTables, orders, renameZone, deleteZone, zones, addZone } = useRestaurantStore();
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useTableHistory(tables);
  const [activeZone, setActiveZone] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'canvas'>('grid');
  const [editMode, setEditMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // New/Edit table dialog
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [newTablePos, setNewTablePos] = useState({ x: 0, y: 0 });
  const [tableForm, setTableForm] = useState({ label: '', seats: 4, shape: 'square' as TableShape, zone: '' });

  // Zone editing state
  const [editingZoneName, setEditingZoneName] = useState<string | null>(null);
  const [newZoneNameValue, setNewZoneNameValue] = useState('');
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);
  const [showZoneManagement, setShowZoneManagement] = useState(false);
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [addingZoneValue, setAddingZoneValue] = useState('');

  // Drag state
  const canvasRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const dragStartSnapshot = useRef<Table[] | null>(null);
  const isDragging = useRef(false);

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const isPanning = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const nextStatus = (current: TableStatus): TableStatus => {
    const flow: Record<TableStatus, TableStatus> = { free: 'occupied', occupied: 'dirty', dirty: 'cleaning', cleaning: 'free', reserved: 'occupied' };
    return flow[current];
  };

  const statusCounts = tables.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const filteredTables = tables.filter(t => {
    if (activeZone !== 'all' && t.zone !== activeZone) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });
  const totalSeats = tables.reduce((s, t) => s + t.seats, 0);
  const occupiedSeats = tables.filter(t => t.status === 'occupied').reduce((s, t) => s + t.seats, 0);
  const getTableOrder = (tableId: string) => orders.find(o => o.tableId === tableId && !['completed', 'cancelled'].includes(o.status));

  // --- Global pointer move/up for reliable drag ---
  useEffect(() => {
    if (!editMode || viewMode !== 'canvas') return;

    const handleMove = (e: PointerEvent) => {
      if (dragRef.current && canvasRef.current) {
        e.preventDefault();
        isDragging.current = true;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom - dragRef.current.offsetX;
        const y = (e.clientY - rect.top) / zoom - dragRef.current.offsetY;
        const cx = Math.max(0, Math.min(CANVAS_W - TABLE_SIZE, Math.round(x / 10) * 10));
        const cy = Math.max(0, Math.min(CANVAS_H - TABLE_SIZE, Math.round(y / 10) * 10));
        updateTablePosition(dragRef.current.id, cx, cy);
        return;
      }
      if (panRef.current) {
        isPanning.current = true;
        setPan({
          x: e.clientX - panRef.current.startX + panRef.current.panX,
          y: e.clientY - panRef.current.startY + panRef.current.panY,
        });
      }
    };

    const handleUp = () => {
      if (dragRef.current && dragStartSnapshot.current) {
        pushSnapshot(dragStartSnapshot.current);
        dragStartSnapshot.current = null;
      }
      dragRef.current = null;
      panRef.current = null;
      // Reset drag flag after a tick so click handlers can check it
      setTimeout(() => { isDragging.current = false; isPanning.current = false; }, 50);
    };

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [editMode, viewMode, zoom, updateTablePosition, pushSnapshot]);

  const handleTablePointerDown = useCallback((e: React.PointerEvent, table: Table) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    dragRef.current = { id: table.id, offsetX: x - table.x, offsetY: y - table.y };
    dragStartSnapshot.current = tables.map(t => ({ ...t }));
    setSelectedTable(table.id);
  }, [editMode, zoom, tables]);

  const pointerDownTime = useRef(0);
  const pointerDownPos = useRef({ x: 0, y: 0 });

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) return;
    pointerDownTime.current = Date.now();
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    if (!editMode) return;
    // Start panning
    panRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    setSelectedTable(null);
  }, [pan, editMode]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!editMode || !canvasRef.current) return;
    // Don't open dialog if we were dragging or panning
    if (isDragging.current || isPanning.current) return;
    const elapsed = Date.now() - pointerDownTime.current;
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    if (elapsed > 400 || dx > 5 || dy > 5) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / zoom - TABLE_SIZE / 2) / 10) * 10;
    const y = Math.round(((e.clientY - rect.top) / zoom - TABLE_SIZE / 2) / 10) * 10;
    const clampedX = Math.max(0, Math.min(CANVAS_W - TABLE_SIZE, x));
    const clampedY = Math.max(0, Math.min(CANVAS_H - TABLE_SIZE, y));

    const nextNum = tables.length + 1;
    setNewTablePos({ x: clampedX, y: clampedY });
    setEditingTableId(null);
    setTableForm({ label: `T${nextNum}`, seats: 4, shape: 'square', zone: zones[0] || 'Main Floor' });
    setShowTableDialog(true);
  }, [editMode, zoom, tables.length, zones]);

  const handleEditTable = useCallback((table: Table) => {
    setEditingTableId(table.id);
    setNewTablePos({ x: table.x, y: table.y });
    setTableForm({ label: table.label, seats: table.seats, shape: table.shape, zone: table.zone });
    setShowTableDialog(true);
  }, []);

  const handleSaveTable = () => {
    if (!tableForm.label.trim()) return;
    pushSnapshot(tables.map(t => ({ ...t })));
    if (editingTableId) {
      updateTableProps(editingTableId, {
        label: tableForm.label.trim(),
        seats: tableForm.seats,
        shape: tableForm.shape,
        zone: tableForm.zone || 'Main Floor',
      });
      toast.success(`Table ${tableForm.label} updated`);
    } else {
      const newTable: Table = {
        id: `table-${Date.now()}`,
        label: tableForm.label.trim(),
        seats: tableForm.seats,
        status: 'free',
        shape: tableForm.shape,
        x: newTablePos.x,
        y: newTablePos.y,
        zone: tableForm.zone || 'Main Floor',
      };
      addTable(newTable);
      setSelectedTable(newTable.id);
      toast.success(`Table ${tableForm.label} added to ${newTable.zone}`);
    }
    setShowTableDialog(false);
    setEditingTableId(null);
  };

  const handleAddTableDirectly = () => {
    setEditingTableId(null);
    setNewTablePos({ x: 100, y: 100 }); // Default position for top-left add
    setTableForm({ label: `T${tables.length + 1}`, seats: 4, shape: 'square', zone: activeZone !== 'all' ? activeZone : (zones[0] || 'Main Floor') });
    setShowTableDialog(true);
  };

  const handleRenameZone = (oldName: string) => {
    const trimmedNewName = newZoneNameValue.trim();
    if (!trimmedNewName) {
      toast.error('Zone name cannot be empty');
      return;
    }
    if (trimmedNewName.length > 20) {
      toast.error('Zone name too long (max 20 chars)');
      return;
    }
    if (zones.includes(trimmedNewName) && trimmedNewName !== oldName) {
      toast.error('Zone name already exists');
      return;
    }

    pushSnapshot(tables.map(t => ({ ...t })));
    renameZone(oldName, trimmedNewName);
    if (activeZone === oldName) setActiveZone(trimmedNewName);
    setEditingZoneName(null);
    toast.success(`Zone renamed to ${trimmedNewName}`);
  };

  const handleAddZone = () => {
    const trimmedName = addingZoneValue.trim();
    if (!trimmedName) {
      toast.error('Zone name cannot be empty');
      return;
    }
    if (zones.includes(trimmedName)) {
      toast.error('Zone name already exists');
      return;
    }

    // To add a zone in the current system, we need to associate it with at least one table.
    // However, we can just let the user "register" it by setting it as the active filter
    // or we can add it to the list of available zones if we change the store.
    // For now, we'll create a "placeholder" logic or just notify the user.
    // Actually, a better way is to allow the UI to show it even if empty.

    // For this implementation, we'll just set it as the active zone and close the adding state.
    // The user can then add a table to this new zone.
    addZone(trimmedName);
    setActiveZone(trimmedName);
    setIsAddingZone(false);
    setAddingZoneValue('');
    toast.success(`Zone "${trimmedName}" created.`);
  };

  const handleDeleteZone = (zoneName: string) => {
    pushSnapshot(tables.map(t => ({ ...t })));
    deleteZone(zoneName);
    if (activeZone === zoneName) setActiveZone('all');
    setZoneToDelete(null);
    toast.success(`Zone ${zoneName} and its tables deleted`);
  };

  const handleDeleteTable = (tableId: string) => {
    pushSnapshot(tables.map(t => ({ ...t })));
    deleteTable(tableId);
    setSelectedTable(null);
  };

  const handleUndo = () => {
    const prev = undo();
    if (prev) setTables(prev);
  };

  const handleRedo = () => {
    const next = redo();
    if (next) setTables(next);
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
    };
    if (editMode && viewMode === 'canvas') {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  });

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Auto-layout if all tables are at 0,0
  useEffect(() => {
    const allAtOrigin = tables.every(t => t.x === 0 && t.y === 0);
    if (allAtOrigin && tables.length > 0) {
      const cols = Math.ceil(Math.sqrt(tables.length));
      tables.forEach((t, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        updateTablePosition(t.id, 40 + col * (TABLE_SIZE + 30), 40 + row * (TABLE_SIZE + 30));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderTableCard = (table: Table, i: number) => {
    const config = statusConfig[table.status];
    const activeOrder = getTableOrder(table.id);
    return (
      <motion.button
        key={table.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03, duration: 0.3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => updateTableStatus(table.id, nextStatus(table.status))}
        className={cn(
          'glass-card p-4 sm:p-5 flex flex-col items-center gap-2.5 cursor-pointer',
          config.bg
        )}
      >
        <div className={cn(
          'w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center font-semibold text-base sm:text-lg bg-background/80 shadow-sm border border-border/30',
          table.shape === 'round' ? 'rounded-full' : 'rounded-xl'
        )}>
          {table.label}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Armchair className="h-3 w-3" />
          <span className="text-xs ">{table.seats} seats</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60">
          <span className={cn('w-2 h-2 rounded-full', config.dot)} />
          <span className="text-[11px] sm:text-xs ">{config.label}</span>
        </div>
        {activeOrder && (
          <span className="text-[10px] sm:text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-full">
            ${activeOrder.total.toFixed(0)} · {activeOrder.items.length} items
          </span>
        )}
      </motion.button>
    );
  };

  const renderCanvasTable = (table: Table) => {
    const config = statusConfig[table.status];
    const activeOrder = getTableOrder(table.id);
    const isSelected = selectedTable === table.id;
    const size = TABLE_SIZE;
    const isRound = table.shape === 'round';

    return (
      <div
        key={table.id}
        onPointerDown={(e) => handleTablePointerDown(e, table)}
        onDoubleClick={(e) => {
          if (editMode) {
            e.stopPropagation();
            handleEditTable(table);
          }
        }}
        onClick={(e) => {
          if (!editMode) {
            e.stopPropagation();
            updateTableStatus(table.id, nextStatus(table.status));
          } else {
            e.stopPropagation();
            setSelectedTable(table.id);
          }
        }}
        style={{
          position: 'absolute',
          left: table.x,
          top: table.y,
          width: size,
          height: size,
          cursor: editMode ? 'grab' : 'pointer',
          zIndex: isSelected ? 10 : 1,
          touchAction: 'none',
        }}
        className="select-none"
      >
        {/* Table shape */}
        <div
          className={cn(
            'w-full h-full flex flex-col items-center justify-center border-2 transition-all duration-150 shadow-sm',
            isRound ? 'rounded-full' : 'rounded-xl',
            isSelected && editMode && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
          )}
          style={{
            backgroundColor: config.canvasBg,
            borderColor: config.canvasBorder,
          }}
        >
          <span className=" text-sm leading-none">{table.label}</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">{table.seats}s</span>
          <div className="flex items-center gap-1 mt-1">
            <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
            <span className="text-[8px] ">{config.label}</span>
          </div>
          {activeOrder && (
            <span className="text-[7px] text-primary mt-0.5">${activeOrder.total.toFixed(0)}</span>
          )}
        </div>

        {/* Seat indicators */}
        {Array.from({ length: Math.min(table.seats, 8) }).map((_, si) => {
          const angle = (si / Math.min(table.seats, 8)) * Math.PI * 2 - Math.PI / 2;
          const dist = size / 2 + 10;
          const cx = size / 2 + Math.cos(angle) * dist - 4;
          const cy = size / 2 + Math.sin(angle) * dist - 4;
          return (
            <div
              key={si}
              className="absolute w-2 h-2 rounded-full bg-muted-foreground/20 border border-border/40"
              style={{ left: cx, top: cy }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-primary/10 border border-border flex items-center justify-center shadow-sm shrink-0">
            <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-medium sm:text-3xl font-medium font-display ">Floor Plan</h1>
            <p className="text-sm text-muted-foreground">{tables.length} tables · {totalSeats} seats</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-muted/50 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all',
                viewMode === 'grid' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              className={cn('px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all',
                viewMode === 'canvas' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              <Move className="h-3.5 w-3.5" /> Canvas
            </button>
          </div>

          <div className="h-8 w-px bg-border/50 mx-1 hidden sm:block" />

          <button
            onClick={handleAddTableDirectly}
            className="h-10 w-10 sm:h-12 sm:w-auto sm:px-5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center sm:justify-start gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
            aria-label="Add new table"
          >
            <Plus className="h-5 w-5 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Add Table</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Available', value: statusCounts['free'] || 0, icon: Grid3X3, color: 'text-fresh', border: 'border-fresh/20' },
          { label: 'Occupied', value: statusCounts['occupied'] || 0, icon: Users, color: 'text-primary', border: 'border-primary/20' },
          { label: 'Reserved', value: statusCounts['reserved'] || 0, icon: Clock, color: 'text-gold', border: 'border-gold/20' },
          { label: 'Seats Used', value: `${occupiedSeats}/${totalSeats}`, icon: Armchair, color: 'text-secondary', border: 'border-secondary/20' },
        ].map((stat) => (
          <div key={stat.label} className={cn('glass-card p-4 sm:p-5 flex items-center gap-4 border', stat.border)}>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
              <stat.icon className={cn('h-5 w-5', stat.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-medium sm:text-3xl font-medium leading-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters (shared for both views) */}
      <div className="space-y-3">
        <div className="sm:hidden flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <Select value={activeZone} onValueChange={(v) => setActiveZone(v as (string | 'all'))}>
              <SelectTrigger className="h-10 bg-muted/40 border-border/50 w-full">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Zone" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All zones</SelectItem>
                {zones.map((z) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={() => setShowZoneManagement(true)}
            className="h-10 w-10 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0"
            title="Manage Zones"
            aria-label="Manage zones"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <div className="flex items-center gap-2 shrink-0 mr-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Zone</span>
            <button
              onClick={() => setShowZoneManagement(true)}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors"
              title="Manage Zones"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <button onClick={() => setActiveZone('all')}
            className={cn('px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all',
              activeZone === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'glass-card hover:bg-muted/30')}>
            All
          </button>
          {zones.map(zone => (
            <button
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={cn('px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all',
                activeZone === zone ? 'bg-primary text-primary-foreground shadow-sm' : 'glass-card hover:bg-muted/30')}
            >
              {zone}
            </button>
          ))}
        </div>

        <div className="sm:hidden">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as (TableStatus | 'all'))}>
            <SelectTrigger className="h-10 bg-muted/40 border-border/50 w-full">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All statuses
              </SelectItem>
              {(Object.entries(statusConfig) as [TableStatus, typeof statusConfig[TableStatus]][]).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('w-2 h-2 rounded-full', config.dot)} />
                      <span className="truncate">{config.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">({statusCounts[status] || 0})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden sm:flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider shrink-0 mr-1">Status</span>
          <button onClick={() => setStatusFilter('all')}
            className={cn('px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5',
              statusFilter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted')}>
            <Filter className="h-3 w-3" /> All
          </button>
          {(Object.entries(statusConfig) as [TableStatus, typeof statusConfig[TableStatus]][]).map(([status, config]) => (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={cn('px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5',
                statusFilter === status ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted')}>
              <span className={cn('w-2 h-2 rounded-full', config.dot)} />
              {config.label} ({statusCounts[status] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* ===== GRID VIEW ===== */}
      {viewMode === 'grid' && (
        <div className="space-y-8">
          {activeZone === 'all' ? (
            zones.map((zone) => {
              const zoneTables = filteredTables.filter(t => t.zone === zone);
              if (zoneTables.length === 0) return null;
              return (
                <section key={zone}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <h2 className="text-base sm:text-lg ">{zone}</h2>
                    <span className="text-xs text-muted-foreground ">({zoneTables.length} tables)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {zoneTables.map((table, i) => renderTableCard(table, i))}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredTables.map((table, i) => renderTableCard(table, i))}
            </div>
          )}
        </div>
      )}

      {/* ===== CANVAS VIEW ===== */}
      {viewMode === 'canvas' && (
        <div className="space-y-3">
          {/* Canvas toolbar */}
          <div className="flex items-center justify-between gap-3 glass-card p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all',
                  editMode
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/50 hover:bg-muted'
                )}
              >
                {editMode ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {editMode ? 'Editing' : 'Locked'}
              </button>
              {editMode && (
                <>
                  <div className="h-5 w-px bg-border/50 mx-1" />
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Redo (Ctrl+Shift+Z)"
                  >
                    <Redo2 className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] text-muted-foreground hidden sm:inline ml-1">
                    Drag · Click to add · Double-click to edit
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
                className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button onClick={resetView}
                className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors ml-1">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 px-1">
            {Object.entries(statusConfig).map(([, config]) => (
              <div key={config.label} className="flex items-center gap-1.5">
                <span className={cn('w-2.5 h-2.5 rounded-full', config.dot)} />
                <span className="text-[11px] text-muted-foreground">{config.label}</span>
              </div>
            ))}
          </div>

          {/* Canvas area */}
          <div
            ref={outerRef}
            className={cn("relative overflow-hidden rounded-xl border border-border/50 bg-muted/20", editMode && "cursor-crosshair")}
            style={{ height: 'calc(100vh - 460px)', minHeight: 400 }}
            onPointerDown={handleCanvasPointerDown}
            onClick={handleCanvasClick}
          >
            <div
              ref={canvasRef}
              className="absolute origin-top-left"
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              {/* Grid dots */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
                <defs>
                  <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.8" fill="hsl(var(--muted-foreground))" opacity="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-dots)" />
              </svg>

              {/* Zone labels */}
              {activeZone === 'all' && zones.map((zone, zi) => {
                const zoneTbls = filteredTables.filter(t => t.zone === zone);
                if (zoneTbls.length === 0) return null;
                const minX = Math.min(...zoneTbls.map(t => t.x));
                const minY = Math.min(...zoneTbls.map(t => t.y));
                return (
                  <div
                    key={zone}
                    className="absolute text-[10px] uppercase tracking-widest text-muted-foreground/40 pointer-events-none"
                    style={{ left: minX, top: Math.max(0, minY - 18) }}
                  >
                    {zone}
                  </div>
                );
              })}

              {/* Tables */}
              {filteredTables.map(renderCanvasTable)}
            </div>

            {/* Empty hint */}
            {filteredTables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No tables match current filters</p>
              </div>
            )}
          </div>

          {/* Selected table info */}
          {selectedTable && (() => {
            const t = tables.find(tb => tb.id === selectedTable);
            if (!t) return null;
            const config = statusConfig[t.status];
            const activeOrder = getTableOrder(t.id);
            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 flex items-center justify-center font-semibold bg-background/80 border border-border/30',
                    t.shape === 'round' ? 'rounded-full' : 'rounded-lg'
                  )}>
                    {t.label}
                  </div>
                  <div>
                    <p className="text-sm ">{t.label} · {t.zone}</p>
                    <p className="text-xs text-muted-foreground">{t.seats} seats · Position ({t.x}, {t.y})</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {activeOrder && (
                    <span className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      ${activeOrder.total.toFixed(2)} · {activeOrder.items.length} items
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50">
                    <span className={cn('w-2 h-2 rounded-full', config.dot)} />
                    <span className="text-xs ">{config.label}</span>
                  </div>
                  <button
                    onClick={() => updateTableStatus(t.id, nextStatus(t.status))}
                    className="px-3 py-1.5 rounded-xl text-xs bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                  >
                    → {statusConfig[nextStatus(t.status)].label}
                  </button>
                  {editMode && (
                    <button
                      onClick={() => handleDeleteTable(t.id)}
                      className="px-2 py-1.5 rounded-xl text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                      title="Delete table"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })()}
        </div>
      )}

      {/* ===== Table Dialog (Create / Edit) ===== */}
      <AnimatePresence>
        {showTableDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
            onClick={() => setShowTableDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-border flex items-center justify-center">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm ">{editingTableId ? 'Edit Table' : 'Add New Table'}</h3>
                    <p className="text-[11px] text-muted-foreground">Position: ({newTablePos.x}, {newTablePos.y})</p>
                  </div>
                </div>
                <button onClick={() => setShowTableDialog(false)} className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Table Label</label>
                  <input
                    type="text"
                    value={tableForm.label}
                    onChange={(e) => setTableForm(f => ({ ...f, label: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="e.g. T11"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Seats</label>
                  <div className="flex items-center gap-2">
                    {[2, 4, 6, 8, 10, 12].map(n => (
                      <button
                        key={n}
                        onClick={() => setTableForm(f => ({ ...f, seats: n }))}
                        className={cn(
                          'h-10 w-10 rounded-xl text-sm font-semibold transition-all',
                          tableForm.seats === n ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted'
                        )}
                      >{n}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Shape</label>
                  <div className="flex gap-2">
                    {([
                      { value: 'square', label: 'Square', icon: '⬜' },
                      { value: 'round', label: 'Round', icon: '⚪' },
                      { value: 'rectangular', label: 'Rect', icon: '▬' },
                    ] as { value: TableShape; label: string; icon: string }[]).map(s => (
                      <button
                        key={s.value}
                        onClick={() => setTableForm(f => ({ ...f, shape: s.value }))}
                        className={cn(
                          'flex-1 h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                          tableForm.shape === s.value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted'
                        )}
                      ><span>{s.icon}</span> {s.label}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Zone</label>
                  <div className="flex gap-2 flex-wrap">
                    {[...zones, '+ New'].map(z => (
                      <button
                        key={z}
                        onClick={() => {
                          if (z === '+ New') {
                            const name = prompt('Enter new zone name:');
                            if (name?.trim()) setTableForm(f => ({ ...f, zone: name.trim() }));
                          } else {
                            setTableForm(f => ({ ...f, zone: z }));
                          }
                        }}
                        className={cn(
                          'px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                          z === '+ New'
                            ? 'border border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary'
                            : tableForm.zone === z ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted'
                        )}
                      >{z}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex gap-2">
                <button
                  onClick={() => setShowTableDialog(false)}
                  className="flex-1 h-10 rounded-xl text-sm bg-muted/50 hover:bg-muted transition-colors"
                >Cancel</button>
                <button
                  onClick={handleSaveTable}
                  disabled={!tableForm.label.trim()}
                  className="flex-1 h-10 rounded-xl text-sm bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {editingTableId ? '✓ Save Changes' : <><Plus className="h-4 w-4" /> Add Table</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone Management Modal */}
      <AnimatePresence>
        {showZoneManagement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
            onClick={() => {
              setShowZoneManagement(false);
              setEditingZoneName(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-border flex items-center justify-center">
                    <Edit2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Manage Zones</h3>
                    <p className="text-[11px] text-muted-foreground">Rename or delete seating zones</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowZoneManagement(false);
                    setEditingZoneName(null);
                    setIsAddingZone(false);
                  }}
                  className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 max-h-[60vh] overflow-y-auto scrollbar-thin space-y-3">
                {/* Add New Zone Input */}
                {isAddingZone ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Enter zone name..."
                      value={addingZoneValue}
                      onChange={(e) => setAddingZoneValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddZone();
                        if (e.key === 'Escape') setIsAddingZone(false);
                      }}
                      className="flex-1 h-9 px-3 rounded-lg border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={handleAddZone}
                      className="h-9 w-9 flex items-center justify-center bg-fresh text-fresh-foreground rounded-lg hover:opacity-90 transition-all"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setIsAddingZone(false)}
                      className="h-9 w-9 flex items-center justify-center bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingZone(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all group"
                  >
                    <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Add New Zone</span>
                  </button>
                )}

                {zones.map((zone) => (
                  <div
                    key={zone}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card/50 group"
                  >
                    {editingZoneName === zone ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          autoFocus
                          type="text"
                          value={newZoneNameValue}
                          onChange={(e) => setNewZoneNameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameZone(zone);
                            if (e.key === 'Escape') setEditingZoneName(null);
                          }}
                          className="flex-1 h-9 px-3 rounded-lg border border-primary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          onClick={() => handleRenameZone(zone)}
                          className="h-9 w-9 flex items-center justify-center bg-fresh/10 text-fresh rounded-lg hover:bg-fresh/20 transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingZoneName(null)}
                          className="h-9 w-9 flex items-center justify-center bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{zone}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {tables.filter(t => t.zone === zone).length} tables
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingZoneName(zone);
                              setNewZoneNameValue(zone);
                            }}
                            className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors"
                            title="Rename"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setZoneToDelete(zone)}
                            className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => {
                    setShowZoneManagement(false);
                    setEditingZoneName(null);
                  }}
                  className="w-full h-10 rounded-xl text-sm font-medium bg-muted/50 hover:bg-muted transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Zone Confirmation Dialog */}
      <AnimatePresence>
        {zoneToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
            onClick={() => setZoneToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Delete Zone?</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Are you sure you want to delete the zone <span className="font-bold text-foreground">"{zoneToDelete}"</span>?
                  All tables within this zone will also be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setZoneToDelete(null)}
                    className="flex-1 h-11 rounded-xl text-sm font-medium bg-muted/50 hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteZone(zoneToDelete)}
                    className="flex-1 h-11 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-lg shadow-destructive/20"
                  >
                    Delete Zone
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
