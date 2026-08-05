import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    createInventoryItem(data: CreateInventoryItemDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        managedById: string;
        location: string;
        category: string;
        itemName: string;
        quantity: number;
        unit: string;
    }>;
    getInventoryItems(): Promise<({
        managedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        managedById: string;
        location: string;
        category: string;
        itemName: string;
        quantity: number;
        unit: string;
    })[]>;
    updateInventoryItem(id: string, data: UpdateInventoryItemDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        managedById: string;
        location: string;
        category: string;
        itemName: string;
        quantity: number;
        unit: string;
    }>;
}
