import React, { useState, useEffect } from "react";
import { getAllAgents, createAgent, updateAgent, deleteAgent } from "../services/agent.service";
import type { Agent } from "../types/index";
import { Button } from "./ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { AgentModal } from "./AgentModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

const AgentPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [agentsPerPage, setAgentsPerPage] = useState(10);
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAgents = async () => {
    try {
      const res = await getAllAgents();
      setAgents(res);
      setFilteredAgents(res);
    } catch (err) {
      console.error(err)
      setErrorMessage("Error fetching agents");
      toast.error("Failed to fetch agents");
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    const filtered = agents.filter(agent =>
      agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAgents(filtered);
    setCurrentPage(1);
  }, [searchTerm, agents]);

  const handleDelete = async (id: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await deleteAgent(id);
      await fetchAgents();
      toast.success("Agent deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete agent");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (agent: Agent) => {
    setIsSaving(true);
    try {
      if (agent.id) {
        await updateAgent(agent.id, agent);
        toast.success("Agent updated successfully");
      } else {
        await createAgent(agent);
        toast.success("Agent created successfully");
      }
      await fetchAgents();
      setModalOpen(false);
      setSelectedAgent(undefined);
    } catch (err) {
      setErrorMessage("Error saving agent");
      console.error(err)
      toast.error(agent.id ? "Failed to update agent" : "Failed to create agent");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!agentToDelete || isSaving) return;
    setIsSaving(true);
    try {
      await handleDelete(agentToDelete.id);
      setDeleteModalOpen(false);
      setAgentToDelete(undefined);
      setErrorMessage(null);
    } catch (err) {
      console.error(err)

      setErrorMessage("Failed to delete agent.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (agent: Agent) => {
    setAgentToDelete(agent);
    setDeleteModalOpen(true);
    setErrorMessage(null);
  };

  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * agentsPerPage,
    currentPage * agentsPerPage
  );

  // Calculate pagination display indices
  const startIndex = (currentPage - 1) * agentsPerPage;
  const endIndex = startIndex + paginatedAgents.length;

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agents</h1>
        <Button
          onClick={() => {
            setSelectedAgent(undefined);
            setModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Search agents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm">
                  <div className="text-gray-500 font-medium">No agents found.</div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.phone || "-"}</TableCell>
                  <TableCell>{agent.description || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(agent)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredAgents.length)} of {filteredAgents.length} agents
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              variant={currentPage === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <AgentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        agent={selectedAgent}
        onSave={handleSave}
      />
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="text-white bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-left text-gray-700">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              Are you sure you want to delete the agent "<b>{agentToDelete?.name}</b>"? This action cannot be undone.
            </DialogDescription>
            {errorMessage && (
              <div className="text-left mt-2 p-2 bg-red-100 text-red-700 rounded">{errorMessage}</div>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setAgentToDelete(undefined);
                setErrorMessage(null);
              }}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isSaving}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {agents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4 sm:gap-0">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={agentsPerPage}
              onChange={(e) => {
                setAgentsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              disabled={isSaving}
              className="w-16 border-gray-300 h-8 rounded"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-1 mx-2 w-full sm:w-auto justify-center sm:justify-start">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <div className="flex space-x-1 w-full sm:w-auto justify-center sm:justify-start">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1 || isSaving}
              onClick={() => handlePageChange(1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              {"|<"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1 || isSaving}
              onClick={() => handlePageChange(currentPage - 1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              {"<"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages || isSaving}
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              {">"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages || isSaving}
              onClick={() => handlePageChange(totalPages)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              {">|"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPage;