/** Categories arrive in learning-area/category display order. */
export function assessmentAccess(items) {
    let predecessorsPassed = true;
    return items.map(item => {
        const available = item.published && item.questionCount > 0;
        const unlocked = available && (predecessorsPassed || item.passed);
        const lockedReason = !available ? 'This assessment is not available yet.' : !unlocked ? 'Pass the previous assessments to unlock this category.' : null;
        predecessorsPassed = predecessorsPassed && item.passed;
        return { isUnlocked: unlocked, lockedReason, status: (item.passed ? 'completed' : unlocked ? 'not-started' : 'locked') };
    });
}
//# sourceMappingURL=assessment-access.js.map