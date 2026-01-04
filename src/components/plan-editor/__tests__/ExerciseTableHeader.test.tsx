import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhaseSectionCompact } from "../PhaseSectionCompact";
import { Phase, ExerciseGroup } from "@/types/plan";

// Mock dnd-kit
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

const createMockPhase = (groups: ExerciseGroup[]): Phase => ({
  id: "phase-1",
  type: "Main Workout",
  objective: "",
  groups,
});

const createSingleExerciseGroup = (): ExerciseGroup => ({
  id: "group-1",
  type: "single",
  name: "",
  order: 1,
  exercises: [
    {
      id: "ex-1",
      name: "Squat",
      sets: 3,
      reps: "10",
      load: "",
      rest: "",
      order: 1,
    },
  ],
});

const mockHandlers = {
  onAddGroup: vi.fn(),
  onUpdateGroup: vi.fn(),
  onDuplicateGroup: vi.fn(),
  onDeleteGroup: vi.fn(),
  onAddExerciseToGroup: vi.fn(),
  onUpdateExercise: vi.fn(),
  onDuplicateExercise: vi.fn(),
  onDeleteExercise: vi.fn(),
};

describe("ExerciseTableHeader visibility", () => {
  it("shows table header when phase has exactly 1 exercise", () => {
    const phase = createMockPhase([createSingleExerciseGroup()]);

    render(<PhaseSectionCompact phase={phase} {...mockHandlers} />);

    // Header should be visible (hidden on mobile, visible on sm+)
    // We check for the text content which should be in the DOM
    expect(screen.getByText(/Esercizio/i)).toBeInTheDocument();
    expect(screen.getByText(/Serie/i)).toBeInTheDocument();
    expect(screen.getByText(/Rip/i)).toBeInTheDocument();
  });

  it("does NOT show table header when phase has 0 exercises", () => {
    const phase = createMockPhase([]);

    render(<PhaseSectionCompact phase={phase} {...mockHandlers} />);

    // Header should not be rendered
    expect(screen.queryByText(/Esercizio/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Serie/i)).not.toBeInTheDocument();
  });

  it("shows table header when phase has multiple exercises", () => {
    const phase = createMockPhase([
      {
        ...createSingleExerciseGroup(),
        id: "group-1",
        order: 1,
      },
      {
        ...createSingleExerciseGroup(),
        id: "group-2",
        order: 2,
        exercises: [
          {
            id: "ex-2",
            name: "Bench Press",
            sets: 4,
            reps: "8",
            load: "",
            rest: "",
            order: 1,
          },
        ],
      },
    ]);

    render(<PhaseSectionCompact phase={phase} {...mockHandlers} />);

    expect(screen.getByText(/Esercizio/i)).toBeInTheDocument();
    expect(screen.getByText(/Serie/i)).toBeInTheDocument();
  });

  it("shows table header when phase has superset with exercises", () => {
    const phase = createMockPhase([
      {
        id: "group-superset",
        type: "superset",
        name: "My Superset",
        order: 1,
        sharedSets: 3,
        exercises: [
          {
            id: "ex-1",
            name: "Curl",
            sets: 3,
            reps: "12",
            load: "",
            rest: "",
            order: 1,
          },
          {
            id: "ex-2",
            name: "Tricep Extension",
            sets: 3,
            reps: "12",
            load: "",
            rest: "",
            order: 2,
          },
        ],
      },
    ]);

    render(<PhaseSectionCompact phase={phase} {...mockHandlers} />);

    expect(screen.getByText(/Esercizio/i)).toBeInTheDocument();
    expect(screen.getByText(/Serie/i)).toBeInTheDocument();
  });
});
