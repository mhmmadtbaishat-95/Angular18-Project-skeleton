import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Step configuration interface
 */
export interface StepConfig {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  completed?: boolean;
  active?: boolean;
  disabled?: boolean;
}

/**
 * Step wizard component
 * Displays a multi-step progress indicator for BPM workflows
 */
@Component({
  selector: 'app-step-wizard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-wizard.component.html',
  styleUrls: ['./step-wizard.component.scss']
})
export class StepWizardComponent implements OnInit {
  @Input() steps: StepConfig[] = [];
  @Input() currentStepIndex: number = 0;
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Output() stepClick = new EventEmitter<number>();

  ngOnInit(): void {
    this.updateStepStates();
  }

  /**
   * Updates step states based on current step index
   */
  updateStepStates(): void {
    this.steps.forEach((step, index) => {
      step.active = index === this.currentStepIndex;
      step.completed = index < this.currentStepIndex;
      step.disabled = index > this.currentStepIndex;
    });
  }

  /**
   * Handles step click
   */
  onStepClick(index: number, step: StepConfig): void {
    if (!step.disabled && index !== this.currentStepIndex) {
      this.stepClick.emit(index);
    }
  }

  /**
   * Gets step status class
   */
  getStepStatusClass(step: StepConfig, index: number): string {
    if (step.completed) return 'completed';
    if (step.active) return 'active';
    if (step.disabled) return 'disabled';
    return 'pending';
  }

  /**
   * Calculates progress percentage
   */
  get progressPercentage(): number {
    if (this.steps.length === 0) return 0;
    return ((this.currentStepIndex + 1) / this.steps.length) * 100;
  }
}

