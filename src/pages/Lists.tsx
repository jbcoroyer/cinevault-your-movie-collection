import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserLists } from "@/hooks/useUserLists";
import { Plus, ListVideo, MoreVertical, Pencil, Trash2, Globe, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Lists() {
  const { lists, loading, createList, updateList, deleteList } = useUserLists();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingList, setEditingList] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIsPublic(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createList(title.trim(), description.trim(), isPublic);
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = async (listId: string) => {
    if (!title.trim()) return;
    await updateList(listId, {
      title: title.trim(),
      description: description.trim() || null,
      is_public: isPublic,
    });
    resetForm();
    setEditingList(null);
  };

  const handleDelete = async (listId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette liste ?")) {
      await deleteList(listId);
    }
  };

  const openEditDialog = (list: typeof lists[0]) => {
    setTitle(list.title);
    setDescription(list.description || "");
    setIsPublic(list.is_public);
    setEditingList(list.id);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Mes Listes</h1>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle liste
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une liste</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="title">Nom de la liste</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Mes comfort movies"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre liste..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="public">Liste publique</Label>
                    <p className="text-sm text-muted-foreground">
                      Visible par tous les utilisateurs
                    </p>
                  </div>
                  <Switch
                    id="public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={!title.trim()}>
                  Créer la liste
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-16">
            <ListVideo className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune liste</h3>
            <p className="text-muted-foreground mb-6">
              Créez votre première liste pour organiser vos films
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une liste
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Link
                key={list.id}
                to={`/lists/${list.id}`}
                className="block group"
              >
                <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                          {list.title}
                        </h3>
                        {list.is_public ? (
                          <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      {list.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {list.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Mise à jour {new Date(list.updated_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            openEditDialog(list);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(list.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la liste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-title">Nom de la liste</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="edit-public">Liste publique</Label>
                <p className="text-sm text-muted-foreground">
                  Visible par tous
                </p>
              </div>
              <Switch
                id="edit-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            <Button
              onClick={() => editingList && handleEdit(editingList)}
              className="w-full"
              disabled={!title.trim()}
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
