import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css',
})
export class PricingComponent {
  faq = [
    { q: 'Is there a free plan?', a: 'Yes! The Free plan gives you 10 analyses per day with no credit card required.', open: false },
    { q: 'How accurate is the detection?', a: 'Our fine-tuned mBERT model achieves 96.4% accuracy on our test set of 30,000+ multilingual samples.', open: false },
    { q: 'Can I use it for my own application?', a: 'Pro and Enterprise plans include REST API access so you can integrate the detection into your own app.', open: false },
    { q: 'What languages are supported?', a: 'The model supports 104 languages via Google\'s multilingual BERT base checkpoint.', open: false },
    { q: 'Can I self-host the model?', a: 'Enterprise plans include on-premise deployment support. The model can run locally with our FastAPI backend.', open: false },
  ];

  toggle(item: any) { item.open = !item.open; }
}
