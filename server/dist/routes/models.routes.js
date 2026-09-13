import { Router } from "express";
import express from "express";
import path from "node:path";
import { prisma } from "../config/db.js";
const router = Router();
// Public inference artifacts contain model parameters only, never camera recordings.
router.use('/files', express.static(path.resolve('model-assets'), { immutable: true, maxAge: '1y', dotfiles: 'deny' }));
router.get('/:category', async (req, res) => {
    try {
        const key = String(req.params.category);
        const name = key.replace(/-/g, ' ');
        const category = await prisma.category.findFirst({ where: { isActive: true, OR: [{ id: key }, { name: { equals: name, mode: 'insensitive' } }] }, select: { id: true, name: true, modelRelease: true } });
        if (!category || !category.modelRelease)
            return res.status(404).json({ message: 'No model has been published for this category yet.' });
        res.setHeader('Cache-Control', 'no-store');
        return res.json({ data: category.modelRelease });
    }
    catch {
        return res.status(503).json({ message: 'Model catalog is temporarily unavailable.' });
    }
});
export default router;
//# sourceMappingURL=models.routes.js.map