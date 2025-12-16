"use client";

import { useState } from "react";
import { useProjectData } from "@/contexts/project-data-context";
import type { Service } from "@/types/project";
import {
    EntityDetailPanel,
    FormField,
    TextInput,
    TextArea,
    SelectInput,
    DisplayField,
} from "@/components/entity-detail-panel";
import { Button } from "@/components/ui/button";

// Type badge helper
function TypeBadges({ service }: { service: Service }) {
    const badges = [];
    if (service.isProduct) {
        badges.push(
            <span key="product" className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
                Product
            </span>
        );
    }
    if (service.isService) {
        badges.push(
            <span key="service" className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                Service
            </span>
        );
    }
    if (badges.length === 0) {
        badges.push(
            <span key="unclassified" className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Unclassified
            </span>
        );
    }
    return <div className="flex gap-1">{badges}</div>;
}

export function ServicesListWithCRUD() {
    const { data, updateService, createService, deleteService } = useProjectData();

    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Service>>({});
    const [showCreate, setShowCreate] = useState(false);
    const [newService, setNewService] = useState<Omit<Service, "id">>({
        name: "",
        description: "",
        status: "pipeline",
        isProduct: false,
        isService: true,
    });

    const openService = (id: string) => {
        setSelectedService(id);
        setIsEditing(false);
        const service = data.services.find((s) => s.id === id);
        if (service) {
            setEditForm({ ...service });
        }
    };

    const handleSave = () => {
        if (selectedService) {
            updateService(selectedService, editForm);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (selectedService) {
            deleteService(selectedService);
            setSelectedService(null);
        }
    };

    const handleCreate = () => {
        if (newService.name) {
            createService(newService);
            setShowCreate(false);
            setNewService({ name: "", description: "", status: "pipeline", isProduct: false, isService: true });
        }
    };

    // Count projects per service
    const getProjectCount = (serviceId: string) =>
        data.projects.filter((p) => p.serviceId === serviceId).length;

    // Filter counts
    const productCount = data.services.filter((s) => s.isProduct).length;
    const serviceCount = data.services.filter((s) => s.isService).length;

    return (
        <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex justify-between items-center">
                <div className="flex gap-4 text-sm text-zinc-500">
                    <span>{data.services.length} total</span>
                    <span className="text-purple-600 dark:text-purple-400">📦 {productCount} products</span>
                    <span className="text-cyan-600 dark:text-cyan-400">🔧 {serviceCount} services</span>
                </div>
                <Button size="sm" onClick={() => setShowCreate(true)}>
                    + New
                </Button>
            </div>

            {/* Services Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.services.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => openService(service.id)}
                        className="text-left p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">
                                {service.isProduct && service.isService ? "📦🔧" : service.isProduct ? "📦" : "🔧"}
                            </span>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate flex-1">
                                {service.name}
                            </h3>
                        </div>
                        <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
                            {service.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between">
                            <TypeBadges service={service} />
                            <span className="text-xs text-zinc-500">
                                {getProjectCount(service.id)} project{getProjectCount(service.id) !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Service Detail Panel */}
            <EntityDetailPanel
                isOpen={selectedService !== null}
                onClose={() => setSelectedService(null)}
                title={data.services.find((s) => s.id === selectedService)?.name ?? ""}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
                onSave={handleSave}
                onDelete={handleDelete}
            >
                {isEditing ? (
                    <>
                        <FormField label="Name">
                            <TextInput
                                value={editForm.name ?? ""}
                                onChange={(v) => setEditForm({ ...editForm, name: v })}
                            />
                        </FormField>
                        <FormField label="Description">
                            <TextArea
                                value={editForm.description ?? ""}
                                onChange={(v) => setEditForm({ ...editForm, description: v })}
                            />
                        </FormField>
                        <FormField label="Status">
                            <SelectInput
                                value={editForm.status ?? "catalog"}
                                onChange={(v) => setEditForm({ ...editForm, status: v as Service["status"] })}
                                options={[
                                    { value: "pipeline", label: "Pipeline" },
                                    { value: "catalog", label: "Catalog" },
                                    { value: "retired", label: "Retired" },
                                ]}
                            />
                        </FormField>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={editForm.isProduct ?? false}
                                    onChange={(e) => setEditForm({ ...editForm, isProduct: e.target.checked })}
                                    className="rounded border-zinc-300 dark:border-zinc-700"
                                />
                                <span>Is a Product</span>
                                <span className="text-zinc-500">(can be acquired/deployed by customers)</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={editForm.isService ?? false}
                                    onChange={(e) => setEditForm({ ...editForm, isService: e.target.checked })}
                                    className="rounded border-zinc-300 dark:border-zinc-700"
                                />
                                <span>Is a Service</span>
                                <span className="text-zinc-500">(ongoing provision of value)</span>
                            </label>
                        </div>
                    </>
                ) : (
                    <>
                        <DisplayField label="Name" value={editForm.name} />
                        <DisplayField label="Description" value={editForm.description} />
                        <DisplayField label="Status" value={editForm.status} />
                        <div className="mt-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Type</label>
                            <div className="mt-1">
                                <TypeBadges service={editForm as Service} />
                            </div>
                        </div>
                        <DisplayField label="ID" value={selectedService ?? ""} />

                        {/* Related Projects */}
                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                Projects
                            </h4>
                            {data.projects.filter((p) => p.serviceId === selectedService).length === 0 ? (
                                <p className="text-sm text-zinc-500 italic">No projects</p>
                            ) : (
                                <ul className="space-y-1">
                                    {data.projects
                                        .filter((p) => p.serviceId === selectedService)
                                        .map((project) => (
                                            <li key={project.id} className="text-sm text-zinc-600 dark:text-zinc-400">
                                                📁 {project.name}
                                            </li>
                                        ))}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </EntityDetailPanel>

            {/* Create Service Panel */}
            <EntityDetailPanel
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                title="Create New Product or Service"
                isEditing={true}
                onSave={handleCreate}
            >
                <FormField label="Name">
                    <TextInput
                        value={newService.name}
                        onChange={(v) => setNewService({ ...newService, name: v })}
                        placeholder="Enter name"
                    />
                </FormField>
                <FormField label="Description">
                    <TextArea
                        value={newService.description ?? ""}
                        onChange={(v) => setNewService({ ...newService, description: v })}
                        placeholder="Describe the product or service"
                    />
                </FormField>
                <FormField label="Status">
                    <SelectInput
                        value={newService.status}
                        onChange={(v) => setNewService({ ...newService, status: v as Service["status"] })}
                        options={[
                            { value: "pipeline", label: "Pipeline" },
                            { value: "catalog", label: "Catalog" },
                            { value: "retired", label: "Retired" },
                        ]}
                    />
                </FormField>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={newService.isProduct ?? false}
                            onChange={(e) => setNewService({ ...newService, isProduct: e.target.checked })}
                            className="rounded border-zinc-300 dark:border-zinc-700"
                        />
                        <span>Is a Product</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={newService.isService ?? false}
                            onChange={(e) => setNewService({ ...newService, isService: e.target.checked })}
                            className="rounded border-zinc-300 dark:border-zinc-700"
                        />
                        <span>Is a Service</span>
                    </label>
                </div>
            </EntityDetailPanel>
        </div>
    );
}
