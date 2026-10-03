import type { Language } from "../types/project";

export type LegalPage = "privacy" | "disclaimer";
type LegalSection = { title: string; paragraphs: string[]; links?: { label: string; href: string }[] };
type LegalDocument = { title: string; introduction: string; sections: LegalSection[] };
const issues = "https://github.com/MeteoR-oo0/desk-recipe/issues";
const githubPrivacy = "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement";
const fontsPrivacy = "https://developers.google.com/fonts/faq/privacy";

export const legalText: Record<Language, {
  date: string; back: string; close: string; language: string;
  privacy: LegalDocument; disclaimer: LegalDocument;
}> = {
  ja: {
    date: "制定日・最終更新日：2026年10月4日",
    back: "アプリのInfoに戻る", close: "閉じる", language: "文書の言語",
    privacy: {
      title: "プライバシーポリシー",
      introduction: "デスクレシピ（Desk Recipe Studio）は、写真や編集内容を利用者の端末内で扱う画像編集アプリです。本ポリシーは、このアプリにおけるデータの扱いを説明します。",
      sections: [
        { title: "1. 写真・編集内容", paragraphs: ["選択した写真、製品名・ブランド・価格、ラベルの位置やデザインなどは、ブラウザ内で処理します。アプリからこれらのデータを運営者のサーバーへ送信する処理はありません。写真・編集内容をアプリからAIサービスへ送信して生成や学習に利用する処理もありません。"] },
        { title: "2. 端末内への保存", paragraphs: ["写真・編集内容は、作業の再開のため、使用中のブラウザのIndexedDBに自動保存します。言語設定とチュートリアルの表示状況はlocalStorageに、アプリのファイルはオフライン利用のためブラウザのキャッシュに保存します。", "別の端末やブラウザへの自動同期はありません。保存データはブラウザのサイトデータ削除機能で削除できます。ブラウザの設定・保存容量・プライベートモードなどによって、保存できない場合やデータが消える場合があります。"] },
        { title: "3. 書き出し・バックアップ・共有", paragraphs: ["画像やプロジェクトファイルは、利用者の操作で端末へ保存します。「プロジェクト保存」でダウンロードするJSONには、写真と編集内容が含まれます。大切な作業はこのファイルでバックアップしてください。", "書き出したファイルの投稿や、ブラウザの連携機能などによる他サービスへの共有は、利用者が選んだ共有先の規約・プライバシーポリシーに従います。"] },
        { title: "4. 外部サービスとの通信", paragraphs: ["アプリの配信にはGitHub Pagesを利用しています。GitHubは、サイトへのアクセス時にIPアドレスをセキュリティ目的で記録・保存します。", "フォントの表示にはGoogle Fontsを利用しています。フォント取得時にGoogleのサーバーへ通信し、IPアドレスなどの通信情報が送られます。この通信に写真や製品ラベルの編集内容を含める処理はありません。外部サービス側の情報の扱いは、それぞれのポリシーをご確認ください。"], links: [{ label: "GitHubのプライバシーポリシー", href: githubPrivacy }, { label: "Google Fontsのプライバシーに関する説明", href: fontsPrivacy }] },
        { title: "5. 広告・アクセス解析", paragraphs: ["現在、このアプリ独自の広告、アクセス解析ツール、アカウント登録・ログイン機能は設けていません。これらを追加する場合は、実際のデータの扱いに合わせて本ポリシーを更新します。"] },
        { title: "6. 運営者・お問い合わせ・改定", paragraphs: ["運営者・制作者：めてお（@Meteor_oo0）", "お問い合わせや不具合報告はGitHubのIssuesで受け付けます。投稿にはGitHubアカウントが必要です。Issuesは公開されるため、個人情報や非公開の写真・プロジェクトファイルを投稿しないでください。", "本ポリシーの改定は、この画面への掲載と最終更新日の変更によりお知らせします。"], links: [{ label: "GitHubのIssuesへ", href: issues }] },
      ],
    },
    disclaimer: {
      title: "免責事項",
      introduction: "デスクレシピ（Desk Recipe Studio）は、利用者が入力した情報を写真や一覧表にまとめるためのツールです。利用にあたって、以下をご確認ください。",
      sections: [
        { title: "1. 動作・出力結果", paragraphs: ["アプリの正常な動作、すべての端末・ブラウザでの互換性、出力画像の品質や正確性、継続的な提供を保証するものではありません。公開・共有する前に、文字、画像、ラベルの配置などをご確認ください。"] },
        { title: "2. 価格・合計金額", paragraphs: ["価格と合計金額は利用者の入力値をもとに表示・計算します。実際の販売価格、税込・税別、送料、値引きなどを自動で確認する機能はありません。", "合計には写真上で非表示の価格も含み、空欄や金額として読み取れない入力は集計から除外します。表示の切り替えはデータの削除を意味しません。計算結果は参考として扱い、必要に応じて入力内容と内訳をご確認ください。"] },
        { title: "3. 保存データ", paragraphs: ["ブラウザ内の自動保存は、永続的な保管やバックアップを保証するものではありません。ブラウザのデータ削除や端末の不具合などで作業が失われる場合があります。大切な作業は「プロジェクト保存」でバックアップしてください。"] },
        { title: "4. 写真・ロゴなどの権利", paragraphs: ["使用する写真、ロゴ、製品情報などについて、著作権、商標権、肖像権、プライバシーその他の権利をご確認ください。本アプリの利用だけで、第三者の素材を利用・公開する許可が得られるものではありません。", "アプリ内の製品名・ブランド名やサンプル表示は、各ブランドとの提携、公式な推薦、情報の正確性を示すものではありません。"] },
        { title: "5. 外部サービス・変更", paragraphs: ["外部リンク先や共有先の内容・サービスは、それぞれの提供者が管理します。本アプリは、機能の変更や提供の中断・終了を行う場合があります。重要な変更や本免責事項の改定は、アプリまたはGitHubリポジトリに掲載します。"] },
        { title: "6. 法令上の責任・お問い合わせ", paragraphs: ["本免責事項は、適用法令によって認められない責任の免除・制限を定めるものではありません。運営者の故意・重大な過失による責任を免除するものではなく、損害に関する責任は適用法令に従います。", "運営者・制作者：めてお（@Meteor_oo0）。お問い合わせはGitHubのIssuesをご利用ください。"], links: [{ label: "GitHubのIssuesへ", href: issues }] },
      ],
    },
  },
  en: {
    date: "Effective date / Last updated: October 4, 2026",
    back: "Back to app Info", close: "Close", language: "Document language",
    privacy: {
      title: "Privacy Policy",
      introduction: "Desk Recipe Studio is an image editor that handles photos and edits on your device. This policy explains how the app handles data.",
      sections: [
        { title: "1. Photos and edits", paragraphs: ["Selected photos, product names, brands, prices, label positions and designs are processed in your browser. The app does not send this data to the operator's server. It also does not send photos or edits to AI services for generation or training."] },
        { title: "2. Storage on your device", paragraphs: ["Photos and edits are automatically saved in your browser's IndexedDB so you can resume your work. Language and tutorial preferences are saved in localStorage. App files are cached in your browser for offline use.", "Data is not automatically synchronized between devices or browsers. You can delete it using your browser's site data controls. Browser settings, storage limits or private browsing may prevent saving or cause data to be lost."] },
        { title: "3. Export, backup and sharing", paragraphs: ["Images and project files are saved to your device when you request an export. JSON files downloaded using Save project contain your photo and edits. Use these files to back up important work.", "Posting exported files or sharing data through browser integrations or other services is subject to the terms and privacy policies of the services you choose."] },
        { title: "4. External services", paragraphs: ["The app is hosted on GitHub Pages. GitHub logs and stores visitors' IP addresses for security purposes.", "Fonts are loaded from Google Fonts. Font requests connect to Google's servers and transmit network information such as your IP address. The app does not include photos or edited label content in these requests. Please refer to each provider's policy for its data practices."], links: [{ label: "GitHub Privacy Statement", href: githubPrivacy }, { label: "Google Fonts privacy information", href: fontsPrivacy }] },
        { title: "5. Advertising and analytics", paragraphs: ["The app currently has no app-specific advertising, analytics tools, account registration or login features. If these are added, this policy will be updated to reflect the actual data practices."] },
        { title: "6. Operator, contact and updates", paragraphs: ["Operator and creator: めてお (@Meteor_oo0).", "Questions and bug reports can be submitted through GitHub Issues. A GitHub account is required to post. Issues are public, so please do not post personal information, private photos or private project files.", "Changes to this policy will be published here with an updated revision date."], links: [{ label: "Contact via GitHub Issues", href: issues }] },
      ],
    },
    disclaimer: {
      title: "Disclaimer",
      introduction: "Desk Recipe Studio is a tool for presenting information you enter on photos and in product tables. Please review the following when using it.",
      sections: [
        { title: "1. Operation and output", paragraphs: ["The app does not guarantee uninterrupted or error-free operation, compatibility with every device or browser, the quality or accuracy of exported images, or continued availability. Check text, images and label positions before publishing or sharing."] },
        { title: "2. Prices and totals", paragraphs: ["Prices and totals are displayed and calculated from your input. The app does not automatically verify retail prices, taxes, shipping costs or discounts.", "Totals include prices hidden on the photo and exclude blank or unrecognized amounts. Hiding a value does not delete its data. Treat calculations as a reference and check your entries and the breakdown when needed."] },
        { title: "3. Saved data", paragraphs: ["Browser autosave is not a guarantee of permanent storage or backup. Clearing browser data or device problems may cause your work to be lost. Use Save project to back up important work."] },
        { title: "4. Rights to photos, logos and other content", paragraphs: ["Check copyright, trademark, image and privacy rights, and any other rights relating to the photos, logos and product information you use. Using this app does not grant permission to use or publish third-party content.", "Product names, brands and sample content in the app do not imply affiliation, official endorsement or verified information."] },
        { title: "5. External services and changes", paragraphs: ["External websites and sharing services are managed by their respective providers. Features may change, and the app may be suspended or discontinued. Important changes or revisions to this disclaimer will be published in the app or its GitHub repository."] },
        { title: "6. Liability under applicable law and contact", paragraphs: ["This disclaimer does not exclude or limit liability where doing so is prohibited by applicable law. It does not exclude liability for the operator's intentional misconduct or gross negligence. Liability for damages is governed by applicable law.", "Operator and creator: めてお (@Meteor_oo0). Please use GitHub Issues for questions."], links: [{ label: "Contact via GitHub Issues", href: issues }] },
      ],
    },
  },
};
